(function() {
  var PI, RTI, assertEqual;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DataView.prototype.pos = 0;

  DataView.prototype.stringFromUint8Slice = function(startOffset, endOffset) {
    var getCharStr, i;
    var _this = this;
    getCharStr = function(i) {
      return String.fromCharCode(_this.getUint8(i));
    };
    return ((function() {
      var _results;
      _results = [];
      for (i = startOffset; startOffset <= endOffset ? i < endOffset : i > endOffset; startOffset <= endOffset ? i++ : i--) {
        _results.push(getCharStr(i));
      }
      return _results;
    })()).join('');
  };

  DataView.prototype.mark = function() {
    return this.markedPos = this.pos;
  };

  DataView.prototype.reset = function() {
    return this.pos = this.markedPos;
  };

  DataView.prototype.peekLine = function() {
    var line;
    this.mark();
    line = this.readLine();
    this.reset();
    return line;
  };

  DataView.prototype.readLine = function() {
    var end, start;
    if (this.pos >= this.byteLength) return null;
    start = this.pos;
    end = -1;
    while ((this.pos < this.byteLength) && (end < start)) {
      if (this.getUint8(this.pos) === 0x0a) {
        if ((this.pos > 0) && (this.getUint8(this.pos - 1) === 0x0d)) {
          end = this.pos - 1;
        } else {
          end = this.pos;
        }
        this.pos = this.pos + 1;
        return this.stringFromUint8Slice(start, end);
      } else {
        this.pos = this.pos + 1;
      }
    }
    return null;
  };

  DataView.prototype.readFloat = function() {
    var ret;
    ret = this.getFloat32(this.pos, true);
    this.pos = this.pos + 4;
    return ret;
  };

  DataView.prototype.readUint8 = function() {
    var ret;
    if (this.pos > (this.byteLength - 10)) console.log(this.pos);
    ret = this.getUint8(this.pos);
    this.pos = this.pos + 1;
    return ret;
  };

  assertEqual = function(tested, expected, errorMessage) {
    if (tested !== expected) throw "Failed assertion: " + errorMessage;
  };

  RTI = (function() {

    function RTI(url) {
      this.url = url;
      this.onLoaded = __bind(this.onLoaded, this);
      this.loadFile();
    }

    RTI.prototype.loadFile = function() {
      var xhr;
      var _this = this;
      xhr = new XMLHttpRequest();
      xhr.open('GET', this.url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function(e) {
        return _this.binaryFileBuffer = xhr.response;
      };
      xhr.addEventListener("load", this.onLoaded, false);
      return xhr.send(null);
    };

    RTI.prototype.onLoaded = function() {
      this.dataStream = new DataView(this.binaryFileBuffer);
      console.log("Loaded RTI file: " + this.binaryFileBuffer.byteLength + " bytes");
      return console.log("Header:          " + (this.dataStream.peekLine()));
    };

    RTI.prototype.getIndex = function(h, w, b, o) {
      return h * (this.width * this.bands * this.order * this.order) + w * (this.bands * this.order * this.order) + b * (this.order * this.order) + o;
    };

    RTI.prototype.parseHSH = function() {
      var b, header_line_2, header_line_3, i, t, value, x, y, _ref, _ref2, _ref3, _results;
      while (this.dataStream.peekLine()[0] === '#') {
        this.dataStream.readLine();
      }
      this.file_type = Number(this.dataStream.readLine());
      header_line_2 = this.dataStream.readLine().split(" ");
      header_line_3 = this.dataStream.readLine().split(" ");
      this.width = Number(header_line_2[0]);
      this.height = Number(header_line_2[1]);
      this.bands = Number(header_line_2[2]);
      this.terms = Number(header_line_3[0]);
      this.basis_type = Number(header_line_3[1]);
      this.element_size = Number(header_line_3[2]);
      console.log("File type:    " + this.file_type);
      console.log("Dimensions:   " + this.width + " x " + this.height);
      console.log("Bands:        " + this.bands);
      console.log("Terms:        " + this.terms);
      console.log("Basis Type:   " + this.basis_type);
      console.log("Element Size: " + this.element_size);
      assertEqual(this.file_type, 3, "Cannot parse non-HSH file type " + this.file_type);
      this.order = Math.sqrt(this.terms);
      this.hshpixels = new Float32Array(this.width * this.height * this.bands * this.order * this.order);
      this.scale = new Float32Array(this.terms);
      for (i = 0, _ref = this.terms; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        this.scale[i] = this.dataStream.readFloat();
      }
      this.bias = new Float32Array(this.terms);
      for (i = 0, _ref2 = this.terms; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        this.bias[i] = this.dataStream.readFloat();
      }
      console.log(this.scale, this.bias);
      this.tmpuc = new Uint8Array(this.terms);
      _results = [];
      for (y = 0, _ref3 = this.height; 0 <= _ref3 ? y < _ref3 : y > _ref3; 0 <= _ref3 ? y++ : y--) {
        console.log("Reading " + y);
        _results.push((function() {
          var _ref4, _results2;
          _results2 = [];
          for (x = 0, _ref4 = this.width; 0 <= _ref4 ? x < _ref4 : x > _ref4; 0 <= _ref4 ? x++ : x--) {
            _results2.push((function() {
              var _ref5, _ref6, _results3;
              _results3 = [];
              for (b = 0, _ref5 = this.bands; 0 <= _ref5 ? b < _ref5 : b > _ref5; 0 <= _ref5 ? b++ : b--) {
                for (i = 0, _ref6 = this.terms; 0 <= _ref6 ? i < _ref6 : i > _ref6; 0 <= _ref6 ? i++ : i--) {
                  this.tmpuc[i] = this.dataStream.readUint8();
                }
                _results3.push((function() {
                  var _ref7, _results4;
                  _results4 = [];
                  for (t = 0, _ref7 = this.terms; 0 <= _ref7 ? t < _ref7 : t > _ref7; 0 <= _ref7 ? t++ : t--) {
                    value = this.tmpuc[t] / 255;
                    value = (value * this.scale[t]) + this.bias[t];
                    _results4.push(this.hshpixels[this.getIndex(this.height - 1 - y, x, b, t)] = value);
                  }
                  return _results4;
                }).call(this));
              }
              return _results3;
            }).call(this));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    return RTI;

  })();

  PI = 3.14159265;

  $(function() {
    var rti;
    rti = new RTI('rti/cuniform.rti');
    window.rti = rti;
    return window.assertEqual = assertEqual;
  });

}).call(this);
