
  $(function() {
    var animate, camera, glsl_fs1, glsl_vs1, plane, renderer, scene;
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(400, 400);
    $('#three').append(renderer.domElement);
    renderer.setClearColorHex(0x555555, 1.0);
    renderer.clear();
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0);
    camera.position.z = 100.0;
    scene.add(camera);
    glsl_vs1 = "\nvoid main() {\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n";
    glsl_fs1 = "\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);\n}\n";
    plane = new THREE.Mesh(new THREE.PlaneGeometry(1.80, 1.80, 1, 1), new THREE.ShaderMaterial({
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
