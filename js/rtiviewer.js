(function() {
  var buildUniforms, drawScene, fragmentShader, vertexShader;

  vertexShader = "\nvarying vec2 pos;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  pos = uv;\n}\n";

  fragmentShader = "\nvarying vec2 pos;\n\nuniform float scale[9];\nuniform float bias[9];\nuniform float weights[9];\n\nuniform sampler2D rtiData[9];\n\nvoid main() {\n\n  gl_FragColor  = (texture2D(rtiData[0], pos) * scale[0] + bias[0]) * weights[0];\n  gl_FragColor += (texture2D(rtiData[1], pos) * scale[1] + bias[1]) * weights[1];\n  gl_FragColor += (texture2D(rtiData[2], pos) * scale[2] + bias[2]) * weights[2];\n  gl_FragColor += (texture2D(rtiData[3], pos) * scale[3] + bias[3]) * weights[3];\n  gl_FragColor += (texture2D(rtiData[4], pos) * scale[4] + bias[4]) * weights[4];\n  gl_FragColor += (texture2D(rtiData[5], pos) * scale[5] + bias[5]) * weights[5];\n  gl_FragColor += (texture2D(rtiData[6], pos) * scale[6] + bias[6]) * weights[6];\n  gl_FragColor += (texture2D(rtiData[7], pos) * scale[7] + bias[7]) * weights[7];\n  gl_FragColor += (texture2D(rtiData[8], pos) * scale[8] + bias[8]) * weights[8];\n  gl_FragColor.a = 1.0;\n\n}\n";

  buildUniforms = function(rti, theta, phi) {
    var i, makeTexture, textures, uniforms, weights;
    var _this = this;
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
    var animate, camera, canvas, canvasPointToWorldPoint, moveHandler, plane, renderer, scene, uniforms, zoomHandler;
    var _this = this;
    if (LOG == null) LOG = false;
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(rti.width, rti.height);
    $('#three').append(renderer.domElement);
    renderer.setClearColorHex(0x555555, 1.0);
    renderer.clear();
    canvas = $('#three > canvas')[0];
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
    zoomHandler = function(deltaY) {
      plane.scale.x *= 1.0 + (deltaY * 0.01);
      plane.scale.x = Math.max(plane.scale.x, 1.0);
      return plane.scale.y = plane.scale.x;
    };
    $('#three > canvas').mousemove(moveHandler);
    $('#three > canvas').mousewheel(function(event, delta, deltaX, deltaY) {
      return zoomHandler(deltaY);
    });
    animate = function(t) {
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      return window.requestAnimationFrame(animate, renderer.domElement);
    };
    return animate(new Date().getTime());
  };

  $(function() {
    var progressBar, progressText, rtiFile, updateProgressBar;
    var _this = this;
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
      var rti;
      var _this = this;
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
