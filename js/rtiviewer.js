(function() {
var PI, acos, atan2, cartesianToSpherical, clamp, cos, max, min, pow, sin, sphericalToCartesian, sqrt;

PI = 3.141592653589793;

atan2 = Math.atan2, acos = Math.acos, sqrt = Math.sqrt, cos = Math.cos, sin = Math.sin, pow = Math.pow, min = Math.min, max = Math.max;

sphericalToCartesian = function(r, theta, phi) {
  return {
    x: r * cos(phi) * sin(theta),
    y: r * sin(phi) * sin(theta),
    z: r * cos(theta)
  };
};

cartesianToSpherical = function(x, y, z) {
  return {
    r: sqrt(x * x + y * y + z * z),
    theta: acos(z),
    phi: atan2(y, x)
  };
};

clamp = function(value) {
  return max(min(value, 1.0), 0.0);
};

var BinaryFile,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

BinaryFile = (function() {

  function BinaryFile(url) {
    var _this = this;
    this.url = url;
    this.onLoaded = __bind(this.onLoaded, this);
    this.onProgress = __bind(this.onProgress, this);
    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', this.url, true);
    this.xhr.responseType = 'arraybuffer';
    this.xhr.onload = function(e) {
      return _this.buffer = _this.xhr.response;
    };
  }

  BinaryFile.prototype.onProgress = function(e) {
    if (e.lengthComputable) return console.log("" + e.loaded + " of " + e.total);
  };

  BinaryFile.prototype.onLoaded = function() {
    this.dataStream = new DataView(this.buffer);
    console.log("Loaded file: " + this.buffer.byteLength + " bytes");
    return this.completionHandler();
  };

  BinaryFile.prototype.load = function(completionHandler) {
    this.completionHandler = completionHandler;
    this.xhr.addEventListener('load', this.onLoaded, false);
    this.xhr.addEventListener('progress', this.onProgress, false);
    return this.xhr.send(null);
  };

  return BinaryFile;

})();

if (window.jdc == null) window.jdc = {};

window.jdc.BinaryFile = BinaryFile;

var DataViewStream;

DataViewStream = (function() {

  function DataViewStream(dataView) {
    this.dataView = dataView;
    this.pos = 0;
  }

  DataViewStream.prototype.stringFromUint8Slice = function(startOffset, endOffset) {
    var getCharStr, i,
      _this = this;
    getCharStr = function(i) {
      return String.fromCharCode(_this.dataView.getUint8(i));
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

  DataViewStream.prototype.mark = function() {
    return this.markedPos = this.pos;
  };

  DataViewStream.prototype.reset = function() {
    return this.pos = this.markedPos;
  };

  DataViewStream.prototype.peekLine = function() {
    var line;
    this.mark();
    line = this.readLine();
    this.reset();
    return line;
  };

  DataViewStream.prototype.readLine = function() {
    var end, start;
    if (this.pos >= this.dataView.byteLength) return null;
    start = this.pos;
    end = -1;
    while ((this.pos < this.dataView.byteLength) && (end < start)) {
      if (this.dataView.getUint8(this.pos) === 0x0a) {
        if ((this.pos > 0) && (this.dataView.getUint8(this.pos - 1) === 0x0d)) {
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

  DataViewStream.prototype.readFloat = function() {
    var ret;
    ret = this.dataView.getFloat32(this.pos, true);
    this.pos = this.pos + 4;
    return ret;
  };

  DataViewStream.prototype.readUint8 = function() {
    var ret;
    ret = this.dataView.getUint8(this.pos);
    this.pos = this.pos + 1;
    return ret;
  };

  return DataViewStream;

})();

var assertEqual;

assertEqual = function(tested, expected, errorMessage) {
  if (tested !== expected) throw "Failed assertion: " + errorMessage;
};

var RTI,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

RTI = (function() {

  function RTI(dataStream) {
    this.dataStream = dataStream;
    this.parse = __bind(this.parse, this);
    this.onParsing = __bind(this.onParsing, this);
  }

  RTI.prototype.onParsing = function(event) {
    return console.log("RTI parsed " + event.parsed + " of " + event.total);
  };

  RTI.prototype.parse = function(completionHandler) {
    this.parseHSH();
    return completionHandler();
  };

  RTI.prototype.getIndex = function(h, w, b, o) {
    return h * (this.width * this.bands * this.order * this.order) + w * (this.bands * this.order * this.order) + b * (this.order * this.order) + o;
  };

  RTI.prototype.parseHSH = function() {
    var b, header_line_2, header_line_3, i, t, x, y, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
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
      for (x = 0, _ref4 = this.width; 0 <= _ref4 ? x < _ref4 : x > _ref4; 0 <= _ref4 ? x++ : x--) {
        for (b = 0, _ref5 = this.bands; 0 <= _ref5 ? b < _ref5 : b > _ref5; 0 <= _ref5 ? b++ : b--) {
          for (t = 0, _ref6 = this.terms; 0 <= _ref6 ? t < _ref6 : t > _ref6; 0 <= _ref6 ? t++ : t--) {
            this.coefficients[this.getIndex(y, x, b, t)] = this.dataStream.readUint8();
          }
        }
      }
      _results.push(this.onParsing({
        total: this.height,
        parsed: y
      }));
    }
    return _results;
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
    var b, i, imagePixelData, j, outputBands, sCoord, t, value, weights, _ref, _ref2, _ref3, _ref4;
    sCoord = cartesianToSpherical(lx, ly, lz);
    weights = this.computeWeights(sCoord.theta, sCoord.phi);
    console.log("Rendering:    " + this.width + " x " + this.height);
    console.log("(lx, ly, lz): (" + lx + ", " + ly + ", " + lz + ")");
    console.log("Context:      " + context);
    context.clearRect(0, 0, this.width, this.height);
    imagePixelData = context.createImageData(this.width, this.height);
    outputBands = 4;
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
    textures = [];
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

var buildUniforms, drawScene, fragmentShader, vertexShader;

vertexShader = "\nvarying vec2 pos;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  pos = uv;\n}\n";

fragmentShader = "\nvarying vec2 pos;\n\nuniform float scale[9];\nuniform float bias[9];\nuniform float weights[9];\n\nuniform sampler2D rtiData[9];\n\nvoid main() {\n\n  gl_FragColor  = (texture2D(rtiData[0], pos) * scale[0] + bias[0]) * weights[0];\n  gl_FragColor += (texture2D(rtiData[1], pos) * scale[1] + bias[1]) * weights[1];\n  gl_FragColor += (texture2D(rtiData[2], pos) * scale[2] + bias[2]) * weights[2];\n  gl_FragColor += (texture2D(rtiData[3], pos) * scale[3] + bias[3]) * weights[3];\n  gl_FragColor += (texture2D(rtiData[4], pos) * scale[4] + bias[4]) * weights[4];\n  gl_FragColor += (texture2D(rtiData[5], pos) * scale[5] + bias[5]) * weights[5];\n  gl_FragColor += (texture2D(rtiData[6], pos) * scale[6] + bias[6]) * weights[6];\n  gl_FragColor += (texture2D(rtiData[7], pos) * scale[7] + bias[7]) * weights[7];\n  gl_FragColor += (texture2D(rtiData[8], pos) * scale[8] + bias[8]) * weights[8];\n  gl_FragColor.a = 1.0;\n\n}\n";

buildUniforms = function(rti, theta, phi) {
  var i, makeTexture, textures, uniforms, weights,
    _this = this;
  textures = rti.makeTextures();
  weights = rti.computeWeights(theta, phi);
  makeTexture = function(i) {
    var t;
    t = new THREE.DataTexture(textures[i], rti.width, rti.height, THREE.RGBFormat);
    t.needsUpdate = true;
    return t;
  };
  uniforms = {
    bias: {
      type: 'fv1',
      value: rti.bias
    },
    scale: {
      type: 'fv1',
      value: rti.scale
    },
    weights: {
      type: 'fv1',
      value: weights
    },
    rtiData: {
      type: 'tv',
      value: 0,
      texture: (function() {
        var _results;
        _results = [];
        for (i = 0; i < 9; i++) {
          _results.push(makeTexture(i));
        }
        return _results;
      })()
    }
  };
  return uniforms;
};

drawScene = function(rti, LOG) {
  var animate, camera, canvas, canvasPointToWorldPoint, moveHandler, plane, renderer, scene, uniforms,
    _this = this;
  if (LOG == null) LOG = false;
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(rti.width, rti.height);
  $('#three').append(renderer.domElement);
  renderer.setClearColorHex(0x555555, 1.0);
  renderer.clear();
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0);
  camera.position.z = 100.0;
  scene.add(camera);
  uniforms = buildUniforms(rti, 0.0, PI);
  this.material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader,
    vertexShader: vertexShader
  });
  plane = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0, 1, 1), this.material);
  scene.add(plane);
  scene.add(camera);
  canvas = $('#three > canvas')[0];
  canvasPointToWorldPoint = function(x, y) {
    x -= canvas.width / 2;
    y *= -1;
    y += canvas.height / 2;
    return [x, y];
  };
  moveHandler = function(event) {
    var lx, ly, lz, min_axis, phi, r, sphericalC, x, y, _ref;
    _ref = canvasPointToWorldPoint(event.offsetX, event.offsetY), x = _ref[0], y = _ref[1];
    min_axis = Math.min(canvas.width, canvas.height) / 2;
    phi = Math.atan2(y, x);
    r = Math.min(Math.sqrt(x * x + y * y), min_axis - 50) / min_axis;
    lx = r * Math.cos(phi);
    ly = r * Math.sin(phi);
    lz = Math.sqrt(1.0 * 1.0 - (lx * lx) - (ly * ly));
    if (LOG) {
      console.log("phi:   " + phi);
      console.log("r:     " + r);
      console.log("lx:    " + lx);
      console.log("ly:    " + ly);
      console.log("lz:    " + lz);
    }
    sphericalC = cartesianToSpherical(lx, ly, lz);
    if (LOG) {
      console.log("theta: " + sphericalC.theta);
      console.log("phi:   " + sphericalC.phi);
    }
    return _this.material.uniforms.weights.value = rti.computeWeights(sphericalC.theta, sphericalC.phi);
  };
  $('#three > canvas').mousemove(moveHandler);
  canvas.onmousewheel = function(event) {
    if (typeof firstWheelDelta === "undefined" || firstWheelDelta === null) {
      firstWheelDelta = event.wheelDeltaY;
    }
    plane.scale.x *= 1.0 + ((event.wheelDeltaY / Math.abs(firstWheelDelta)) * 0.01);
    plane.scale.x = Math.max(plane.scale.x, 1.0);
    return plane.scale.y = plane.scale.x;
  };
  animate = function(t) {
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
    return window.requestAnimationFrame(animate, renderer.domElement);
  };
  return animate(new Date().getTime());
};

$(function() {
  var progressBar, progressText, rtiFile, updateProgressBar,
    _this = this;
  progressText = $('#loading > span');
  progressBar = $('progress');
  updateProgressBar = function(current, total) {
    var completionPct;
    completionPct = (current / total) * 100.0;
    return progressBar.attr('value', completionPct);
  };
  rtiFile = new jdc.BinaryFile('rti/coin.rti');
  rtiFile.onProgress = function(event) {
    if (event.lengthComputable) {
      return updateProgressBar(event.loaded, event.total);
    }
  };
  return rtiFile.load(function() {
    var rti,
      _this = this;
    progressText.text('Parsing RTI file:');
    rti = new RTI(new DataViewStream(rtiFile.dataStream));
    rti.onParsing = function(event) {
      return updateProgressBar(event.parsed, event.total);
    };
    return rti.parse(function() {
      progressText.hide();
      progressBar.hide();
      return drawScene(rti);
    });
  });
});

}).call(this);