// RTI file info : These variables are initialize in the loadHSH function
// rtiwidth, rtiheight - Height and width of the loaded RTI
// bands - Number of color channels in the image, usually 3
// order - The order of the RTI reflectance model. The actual number of coefficients (i.e. terms) = order * order
var width, height, bands, order;

// The global light position, used in the renderImageHSH() method. Normalize before calling the renderImageHSH()
var lx, ly, lz;  // float

const PI = 3.14159265;

// Returns the index of an element in the HSHImage float array given the following arguments,
// h - y position of the current pixel
// w - x position of the current pixel
// b - the current color channel
// o - the current term (keep in mind there are order*order terms)

function getIndex(h, w, b, o) {
  return h * (width*bands*order*order) + w * (bands*order*order) + b*(order*order) + o;
}

// Returns a float array containing the entire RTI coefficient set. The order of elements in the float array is,
// rtiheight*rtiwidth*bands*terms
// (where terms = (order*order), for other variables check the comments above)

// http://siphon9.net/loune/2011/05/javascript-arraybuffer-binary-handling-in-javascript/
// https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
// https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBufferView
//
// Assume that we are getting passed a Uint8Array, which is an ArrayBufferView backed by an ArrayBuffer

function loadHSH(hsh_file_buffer) {
  var scale = new Float32Array(30);
  var bias  = new Float32Array(30);
  var tmpuc = new Uint8Array(30);

  // strip all lines beginning with #; (used ifstream::infile.peek)
  // header lines are terminated with CRLF

  var file_type, terms, basis_type, element_size;
  var dummy_scale, dummy_bias;

  file_type = hsh_file_buffer.getLine();
  var header_line_2 = hsh_file_buffer.getLine().toString().split(" ");
  var header_line_3 = hsh_file_buffer.getLine().toString().split(" ");
  rtiwidth     = header_line_2[0];
  rtiheight    = header_line_2[1];
  bands        = header_line_2[2];
  terms        = header_line_3[0];
  basis_type   = header_line_3[1];
  element_size = header_line_3[2];
  // discard empty line where an adaptive basis section would go
  hsh_file_buffer.getLine();

  order = Math.sqrt(terms);
  var hshpixels = new Float32Array(rtiwidth*rtiheight*bands*order*order);

  // Read the scale values

  for (i = 0; i < terms; i++) {
    scale[i] = hsh_file_buffer.getFloat32(); // NOTE: getFloat32 needs to be smart about reading 4 Uint8s into a Float32
  }

  // Read the bias values

  for (i = 0; i < terms; i++) {
    bias[i] = hsh_file_buffer.getFloat32();
  }

  // Read the main data block

  for (j = 0; j < rtiheight; j++) {
    for (i = 0; i < rtiwidth; i++) {
      for (b = 0; b < bands; b++) {
        tmpuc = hsh_file_buffer.getManyUint8(terms)
        for (q = 0; q < terms; q++) {
          value = tmpuc[q]/255;
          value = (value*scale[q])+bias[q];
          // flip the image (rtiheight - 1 - j) for OpenGL pixel rendering
          hshpixels[getIndex(rtiheight-1-j,i,b,q)] = value;
        }
      }
    }
  }
  return hshpixels;
}

Uint8Array.prototype.pos = 0;
Uint8Array.prototype.getLine = function() {
  if (this.pos >= this.length) {
    return null
  }
  // Lines end with either LF (0x0a) or CRLF (0x0d0a).
  var start = this.pos;
  var end   = -1;
  while ((this.pos < this.length) && (end < start)) {
    if (this[this.pos] === 0x0a) {
      if ((this.pos > 0) && (this[this.pos-1] === 0x0d)) {
        end = this.pos - 1;
      } else {
        end = this.pos;
      }
      this.pos = this.pos + 1;
      return this.subarray(start, end)
    }
    this.pos = this.pos + 1;
  }
  return null
}
// Read little-endian IEEE754 32-bit floats
// See: http://en.wikipedia.org/wiki/Single_precision_floating-point_format
Uint8Array.prototype.BinaryParser = new BinaryParser(false, true);
Uint8Array.prototype.getFloat32 = function() {
  if ((this.pos+4) >= this.length) {
    return null;
  }
  var data = uInt8Array.subarray(this.pos, this.pos+4);
  this.pos = this.pos + 4;
  return this.BinaryParser.decodeFloat(data, 23, 8);
}
Uint8Array.prototype.getUint8 = function() {
  if (this.pos >= this.length) {
    return null;
  }
  var data = uInt8Array[this.pos];
  this.pos = this.pos + 1;
  return this.BinaryParser.decodeInt(data, 8, false);
}
Uint8Array.prototype.getManyUint8 = function(count) {
  var ret = new Uint8Array(count);
  for (i = 0; i < count; i++) {
    ret[i] = this.getUint8();
  }
  return ret;
}
Uint8Array.prototype.toString = function() {
  var ret = "";
  for (i = 0; i < this.length; i++) {
    ret += String.fromCharCode(this[i]);
  }
  return ret;
}
