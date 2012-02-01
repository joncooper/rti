(function() {
  var buildUniforms, drawScene, fragmentShader, vertexShader;

  vertexShader = "\nvarying vec2 pos;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  pos = uv;\n}\n";

  fragmentShader = "\nvarying vec2 pos;\n\nuniform float scale[9];\nuniform float bias[9];\nuniform float weights[9];\n\nuniform sampler2D rtiData[9];\n\nvoid main() {\n\n  gl_FragColor  = (texture2D(rtiData[0], pos) * scale[0] + bias[0]) * weights[0];\n  gl_FragColor += (texture2D(rtiData[1], pos) * scale[1] + bias[1]) * weights[1];\n  gl_FragColor += (texture2D(rtiData[2], pos) * scale[2] + bias[2]) * weights[2];\n  gl_FragColor += (texture2D(rtiData[3], pos) * scale[3] + bias[3]) * weights[3];\n  gl_FragColor += (texture2D(rtiData[4], pos) * scale[4] + bias[4]) * weights[4];\n  gl_FragColor += (texture2D(rtiData[5], pos) * scale[5] + bias[5]) * weights[5];\n  gl_FragColor += (texture2D(rtiData[6], pos) * scale[6] + bias[6]) * weights[6];\n  gl_FragColor += (texture2D(rtiData[7], pos) * scale[7] + bias[7]) * weights[7];\n  gl_FragColor += (texture2D(rtiData[8], pos) * scale[8] + bias[8]) * weights[8];\n  gl_FragColor.a = 1.0;\n\n}\n";

  buildUniforms = function(rti, theta, phi) {
    var i, texify, textures, uniforms, weights, _ref;
    var _this = this;
    if ((_ref = this.textureCache) == null) this.textureCache = rti.makeTextures();
    textures = this.textureCache;
    weights = rti.computeWeights(theta, phi);
    texify = function(i) {
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
            _results.push(texify(i));
          }
          return _results;
        })()
      }
    };
    return uniforms;
  };

  this.uniforms = {};

  drawScene = function(rti) {
    var animate, camera, moveHandler, plane, renderer, scene, uniforms;
    var _this = this;
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
    moveHandler = function(event) {
      var canvas, canvasOffset, lx, ly, lz, min_axis, phi, r, sphericalC, x, y;
      canvas = $('#three > canvas')[0];
      canvasOffset = $(canvas).offset();
      x = event.clientX + Math.floor(canvasOffset.left);
      y = event.clientY + Math.floor(canvasOffset.top) + 1;
      x -= canvas.width / 2;
      y *= -1;
      y += canvas.height / 2;
      min_axis = Math.min(canvas.width, canvas.height) / 2;
      phi = Math.atan2(y, x);
      r = Math.min(Math.sqrt(x * x + y * y), min_axis - 50) / min_axis;
      lx = r * Math.cos(phi);
      ly = r * Math.sin(phi);
      lz = Math.sqrt(1.0 * 1.0 - (lx * lx) - (ly * ly));
      sphericalC = rti.cartesianToSpherical(lx, ly, lz);
      return _this.material.uniforms.weights.value = rti.computeWeights(sphericalC.theta, sphericalC.phi);
    };
    $('#three > canvas').mousemove(moveHandler);
    animate = function(t) {
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      return window.requestAnimationFrame(animate, renderer.domElement);
    };
    return animate(new Date().getTime());
  };

  $(function() {
    var rtiFile;
    rtiFile = new jdc.BinaryFile('rti/coin.rti');
    return rtiFile.load(function() {
      var rti;
      rti = new jdc.RTI(rtiFile.dataStream);
      return rti.parse(function() {
        return drawScene(rti);
      });
    });
  });

}).call(this);
