(function() {
  var PI, buildUniforms, drawScene, fragmentShader, vertexShader;

  PI = 3.141592653589793;

  vertexShader = "\nvarying vec2 pos;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  pos = uv;\n}\n";

  fragmentShader = "\nvarying vec2 pos;\n\nuniform float scale[9];\nuniform float bias[9];\nuniform float weights[9];\n\nuniform sampler2D tex0;\nuniform sampler2D tex1;\nuniform sampler2D tex2;\nuniform sampler2D tex3;\nuniform sampler2D tex4;\nuniform sampler2D tex5;\nuniform sampler2D tex6;\nuniform sampler2D tex7;\nuniform sampler2D tex8;\n\nvoid main() {\n\n  gl_FragColor  = (texture2D(tex0, pos) * scale[0] + bias[0]) * weights[0];\n  gl_FragColor += (texture2D(tex1, pos) * scale[1] + bias[1]) * weights[1];\n  gl_FragColor += (texture2D(tex2, pos) * scale[2] + bias[2]) * weights[2];\n  gl_FragColor += (texture2D(tex3, pos) * scale[3] + bias[3]) * weights[3];\n  gl_FragColor += (texture2D(tex4, pos) * scale[4] + bias[4]) * weights[4];\n  gl_FragColor += (texture2D(tex5, pos) * scale[5] + bias[5]) * weights[5];\n  gl_FragColor += (texture2D(tex6, pos) * scale[6] + bias[6]) * weights[6];\n  gl_FragColor += (texture2D(tex7, pos) * scale[7] + bias[7]) * weights[7];\n  gl_FragColor += (texture2D(tex8, pos) * scale[8] + bias[8]) * weights[8];\n  gl_FragColor.a = 1.0;\n\n}\n";

  buildUniforms = function(rti, theta, phi) {
    var texify, textures, uniforms, weights, _ref;
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
      tex0: {
        type: 't',
        value: 0,
        texture: texify(0)
      },
      tex1: {
        type: 't',
        value: 1,
        texture: texify(1)
      },
      tex2: {
        type: 't',
        value: 2,
        texture: texify(2)
      },
      tex3: {
        type: 't',
        value: 3,
        texture: texify(3)
      },
      tex4: {
        type: 't',
        value: 4,
        texture: texify(4)
      },
      tex5: {
        type: 't',
        value: 5,
        texture: texify(5)
      },
      tex6: {
        type: 't',
        value: 6,
        texture: texify(6)
      },
      tex7: {
        type: 't',
        value: 7,
        texture: texify(7)
      },
      tex8: {
        type: 't',
        value: 8,
        texture: texify(8)
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
    uniforms = buildUniforms(rti, 0.07, 2.45);
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
      console.log("clicked at", x, y);
      min_axis = Math.min(canvas.width, canvas.height) / 2;
      console.log("min_axis", min_axis);
      phi = Math.atan2(y, x);
      r = Math.min(Math.sqrt(x * x + y * y), min_axis - 50) / min_axis;
      lx = r * Math.cos(phi);
      ly = r * Math.sin(phi);
      lz = Math.sqrt(1.0 * 1.0 - (lx * lx) - (ly * ly));
      console.log("phi:   " + phi);
      console.log("r:     " + r);
      console.log("lx:    " + lx);
      console.log("ly:    " + ly);
      console.log("lz:    " + lz);
      sphericalC = rti.cartesianToSpherical(lx, ly, lz);
      console.log("theta: " + sphericalC.theta);
      console.log("phi:   " + sphericalC.phi);
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
