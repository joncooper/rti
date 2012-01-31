(function() {
  var RTI, assertEqual, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  assertEqual = function(tested, expected, errorMessage) {
    if (tested !== expected) throw "Failed assertion: " + errorMessage;
  };

  RTI = (function() {
    var PI, acos, atan2, cos, max, min, pow, sin, sqrt;

    PI = 3.14159265;

    atan2 = Math.atan2, acos = Math.acos, sqrt = Math.sqrt, cos = Math.cos, sin = Math.sin, pow = Math.pow, min = Math.min, max = Math.max;

    function RTI(dataStream) {
      this.dataStream = dataStream;
      this.parse = __bind(this.parse, this);
    }

    RTI.prototype.parse = function(completionHandler) {
      this.parseHSH();
      return completionHandler();
    };

    RTI.prototype.getIndex = function(h, w, b, o) {
      return h * (this.width * this.bands * this.order * this.order) + w * (this.bands * this.order * this.order) + b * (this.order * this.order) + o;
    };

    RTI.prototype.parseHSH = function() {
      var b, header_line_2, header_line_3, i, t, x, y, _ref, _ref2, _ref3, _results;
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
      console.log("Dimensions:   " + this.width + " x " + this.height);
      console.log("Bands:        " + this.bands);
      console.log("Terms:        " + this.terms);
      console.log("Basis Type:   " + this.basis_type);
      console.log("Element Size: " + this.element_size);
      assertEqual(this.file_type, 3, "Cannot parse non-HSH file type " + this.file_type);
      this.order = Math.sqrt(this.terms);
      this.coefficients = new Uint8Array(this.width * this.height * this.bands * this.terms);
      this.scale = new Float32Array(this.terms);
      for (i = 0, _ref = this.terms; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        this.scale[i] = this.dataStream.readFloat();
      }
      this.bias = new Float32Array(this.terms);
      for (i = 0, _ref2 = this.terms; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        this.bias[i] = this.dataStream.readFloat();
      }
      _results = [];
      for (y = 0, _ref3 = this.height; 0 <= _ref3 ? y < _ref3 : y > _ref3; 0 <= _ref3 ? y++ : y--) {
        _results.push((function() {
          var _ref4, _results2;
          _results2 = [];
          for (x = 0, _ref4 = this.width; 0 <= _ref4 ? x < _ref4 : x > _ref4; 0 <= _ref4 ? x++ : x--) {
            _results2.push((function() {
              var _ref5, _results3;
              _results3 = [];
              for (b = 0, _ref5 = this.bands; 0 <= _ref5 ? b < _ref5 : b > _ref5; 0 <= _ref5 ? b++ : b--) {
                _results3.push((function() {
                  var _ref6, _results4;
                  _results4 = [];
                  for (t = 0, _ref6 = this.terms; 0 <= _ref6 ? t < _ref6 : t > _ref6; 0 <= _ref6 ? t++ : t--) {
                    _results4.push(this.coefficients[this.getIndex(y, x, b, t)] = this.dataStream.readUint8());
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

    RTI.prototype.sphericalToCartesian = function(r, theta, phi) {
      return {
        x: r * cos(phi) * sin(theta),
        y: r * sin(phi) * sin(theta),
        z: r * cos(theta)
      };
    };

    RTI.prototype.cartesianToSpherical = function(x, y, z) {
      return {
        r: sqrt(x * x + y * y + z * z),
        theta: acos(z),
        phi: atan2(y, x)
      };
    };

    RTI.prototype.computeWeights = function(theta, phi) {
      var weights;
      weights = new Float32Array(16);
      if (phi < 0) phi = phi + (2 * PI);
      weights[0] = 1 / sqrt(2 * PI);
      weights[1] = sqrt(6 / PI) * (cos(phi) * sqrt(cos(theta) - cos(theta) * cos(theta)));
      weights[2] = sqrt(3 / (2 * PI)) * (-1 + 2 * cos(theta));
      weights[3] = sqrt(6 / PI) * (sqrt(cos(theta) - cos(theta) * cos(theta)) * sin(phi));
      weights[4] = sqrt(30 / PI) * (cos(2 * phi) * (-cos(theta) + cos(theta) * cos(theta)));
      weights[5] = sqrt(30 / PI) * (cos(phi) * (-1 + 2 * cos(theta)) * sqrt(cos(theta) - cos(theta) * cos(theta)));
      weights[6] = sqrt(5 / (2 * PI)) * (1 - 6 * cos(theta) + 6 * cos(theta) * cos(theta));
      weights[7] = sqrt(30 / PI) * ((-1 + 2 * cos(theta)) * sqrt(cos(theta) - cos(theta) * cos(theta)) * sin(phi));
      weights[8] = sqrt(30 / PI) * ((-cos(theta) + cos(theta) * cos(theta)) * sin(2 * phi));
      weights[9] = 2 * sqrt(35 / PI) * cos(3 * phi) * pow(cos(theta) - cos(theta) * cos(theta), 3 / 2);
      weights[10] = sqrt(210 / PI) * cos(2 * phi) * (-1 + 2 * cos(theta)) * (-cos(theta) + cos(theta) * cos(theta));
      weights[11] = 2 * sqrt(21 / PI) * cos(phi) * sqrt(cos(theta) - cos(theta) * cos(theta)) * (1 - 5 * cos(theta) + 5 * cos(theta) * cos(theta));
      weights[12] = sqrt(7 / (2 * PI)) * (-1 + 12 * cos(theta) - 30 * cos(theta) * cos(theta) + 20 * cos(theta) * cos(theta) * cos(theta));
      weights[13] = 2 * sqrt(21 / PI) * sqrt(cos(theta) - cos(theta) * cos(theta)) * (1 - 5 * cos(theta) + 5 * cos(theta) * cos(theta)) * sin(phi);
      weights[14] = sqrt(210 / PI) * (-1 + 2 * cos(theta)) * (-cos(theta) + cos(theta) * cos(theta)) * sin(2 * phi);
      weights[15] = 2 * sqrt(35 / PI) * pow(cos(theta) - cos(theta) * cos(theta), 3 / 2) * sin(3 * phi);
      return weights;
    };

    RTI.prototype.renderImageHSH = function(context, lx, ly, lz) {
      var b, clamp, i, imagePixelData, j, outputBands, sCoord, t, value, weights, _ref, _ref2, _ref3, _ref4;
      sCoord = this.cartesianToSpherical(lx, ly, lz);
      weights = this.computeWeights(sCoord.theta, sCoord.phi);
      console.log("Rendering:    " + this.width + " x " + this.height);
      console.log("(lx, ly, lz): (" + lx + ", " + ly + ", " + lz + ")");
      console.log("Context:      " + context);
      context.clearRect(0, 0, this.width, this.height);
      imagePixelData = context.createImageData(this.width, this.height);
      outputBands = 4;
      clamp = function(value) {
        return max(min(value, 1.0), 0.0);
      };
      for (j = 0, _ref = this.height; 0 <= _ref ? j < _ref : j > _ref; 0 <= _ref ? j++ : j--) {
        for (i = 0, _ref2 = this.width; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
          for (b = 0, _ref3 = this.bands; 0 <= _ref3 ? b < _ref3 : b > _ref3; 0 <= _ref3 ? b++ : b--) {
            value = 0.0;
            for (t = 0, _ref4 = this.terms; 0 <= _ref4 ? t < _ref4 : t > _ref4; 0 <= _ref4 ? t++ : t--) {
              value += ((this.coefficients[this.getIndex(j, i, b, t)] / 255) * this.scale[t] + this.bias[t]) * weights[t];
            }
            value = clamp(value);
            imagePixelData.data[j * this.width * outputBands + i * outputBands + b] = value * 255;
          }
          imagePixelData.data[(j * this.width * outputBands) + (i * outputBands) + 3] = 255;
        }
      }
      window.imagePixelData = imagePixelData;
      return context.putImageData(imagePixelData, 0, 0);
    };

    RTI.prototype.makeTextures = function() {
      var channel, i, term, textureData, textures, x, y, _ref, _ref2, _ref3, _ref4;
      textures = {};
      for (term = 0, _ref = this.terms; 0 <= _ref ? term < _ref : term > _ref; 0 <= _ref ? term++ : term--) {
        textureData = new Uint8Array(this.width * this.height * this.bands);
        i = 0;
        for (y = 0, _ref2 = this.height; 0 <= _ref2 ? y < _ref2 : y > _ref2; 0 <= _ref2 ? y++ : y--) {
          for (x = 0, _ref3 = this.width; 0 <= _ref3 ? x < _ref3 : x > _ref3; 0 <= _ref3 ? x++ : x--) {
            for (channel = 0, _ref4 = this.bands; 0 <= _ref4 ? channel < _ref4 : channel > _ref4; 0 <= _ref4 ? channel++ : channel--) {
              textureData[i] = this.coefficients[this.getIndex(y, x, channel, term)];
              i += 1;
            }
          }
        }
        textures[term] = textureData;
      }
      return textures;
    };

    return RTI;

  })();

  window.go = function() {
    var canvas, moveHandler;
    var _this = this;
    canvas = $('#rgbtexture > canvas')[0];
    window.drawContext = canvas.getContext('2d');
    console.log("Parsing RTI file...");
    rti.parseHSH();
    console.log("Parsed.");
    canvas.width = rti.width;
    canvas.height = rti.height;
    moveHandler = function(event) {
      var canvasOffset, lx, ly, lz, min_axis, r, theta, x, y;
      canvasOffset = $(canvas).offset();
      x = event.clientX + Math.floor(canvasOffset.left);
      y = event.clientY + Math.floor(canvasOffset.top) + 1;
      x -= canvas.width / 2;
      y *= -1;
      y += canvas.height / 2;
      console.log("clicked at", x, y);
      min_axis = Math.min(canvas.width, canvas.height) / 2;
      console.log("min_axis", min_axis);
      theta = Math.atan2(y, x);
      r = Math.min(Math.sqrt(x * x + y * y), min_axis) / min_axis;
      lx = r * Math.cos(theta);
      ly = r * Math.sin(theta);
      lz = Math.sqrt(1.0 * 1.0 - (lx * lx) - (ly * ly));
      console.log("theta, r, lx, ly", theta, r, lx, ly);
      return window.draw(lx, ly, lz);
    };
    return $('#rgbtexture > canvas').mousemove(moveHandler);
  };

  window.drawS = function(theta, phi) {
    var x, y, z;
    x = Math.cos(theta) * Math.sin(phi);
    y = Math.sin(theta) * Math.sin(phi);
    z = Math.cos(phi);
    console.log("Drawing: (" + x + ", " + y + ", " + z + ")");
    return window.draw(x, y, z);
  };

  window.draw = function(x, y, z) {
    return rti.renderImageHSH(window.drawContext, x, y, z);
  };

  window.assertEqual = assertEqual;

  if ((_ref = window.jdc) == null) window.jdc = {};

  window.jdc.RTI = RTI;

}).call(this);
