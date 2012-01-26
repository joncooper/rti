
  $(function() {
    var animate, camera, glsl_fs1, glsl_vs1, plane, renderer, scene, uniforms;
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 400);
    $('#three').append(renderer.domElement);
    renderer.setClearColorHex(0x555555, 1.0);
    renderer.clear();
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0);
    camera.position.z = 100.0;
    scene.add(camera);
    glsl_vs1 = "\nvarying vec2 pos;\n\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  pos = uv;\n}\n";
    glsl_fs1 = "\nvarying vec2 pos;\nuniform sampler2D tex0;\nuniform sampler2D tex1;\n\nvoid main() {\n  vec4 t0 = texture2D(tex0, pos);\n  t0.a = 0.5;\n\n  vec4 t1 = texture2D(tex1, pos);\n  t1.a = 0.5;\n\n  vec4 emitColor = mix(t0, t1, 0.5);\n  emitColor.a = 1.0;\n\n  gl_FragColor = emitColor;\n}\n";
    uniforms = {
      tex0: {
        type: 't',
        value: 0,
        texture: THREE.ImageUtils.loadTexture('/shaders/lets-eat-grandma.jpg')
      },
      tex1: {
        type: 't',
        value: 1,
        texture: THREE.ImageUtils.loadTexture('/shaders/igloo.jpg')
      }
    };
    plane = new THREE.Mesh(new THREE.PlaneGeometry(1.80, 1.80, 1, 1), new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: glsl_fs1,
      vertexShader: glsl_vs1
    }));
    scene.add(plane);
    scene.add(camera);
    animate = function(t) {
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      return requestAnimationFrame(animate, renderer.domElement);
    };
    return animate(new Date().getTime());
  });
