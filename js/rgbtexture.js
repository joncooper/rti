(function() {
  var drawRGBTexture, drawThreeScene, makeRGBTexture, makeTexture;

  makeRGBTexture = function(context, size) {
    var b, base_offset, column, g, imageData, r, row, x, y;
    imageData = context.createImageData(size, size);
    for (x = 0; 0 <= size ? x < size : x > size; 0 <= size ? x++ : x--) {
      for (y = 0; 0 <= size ? y < size : y > size; 0 <= size ? y++ : y--) {
        base_offset = (size * 4 * y) + (4 * x);
        column = Math.floor((x / size) * 2);
        row = Math.floor((y / size) * 2);
        r = column === 1 && row === 0 ? 220 : 0;
        g = column === 1 && row === 1 ? 220 : 0;
        b = column === 0 && row === 1 ? 220 : 0;
        imageData.data[base_offset + 0] = r;
        imageData.data[base_offset + 1] = g;
        imageData.data[base_offset + 2] = b;
        imageData.data[base_offset + 3] = 255;
      }
    }
    return imageData;
  };

  drawRGBTexture = function() {
    var canvas, context, size;
    canvas = $('#rgbtexture > canvas')[0];
    context = canvas.getContext('2d');
    size = $('#rgbtexture > canvas').width();
    this.textureData = makeRGBTexture(context, size);
    return context.putImageData(this.textureData, 0, 0);
  };

  drawThreeScene = function(container, texture) {
    var FOV, VIEW_ASPECT_RATIO, animate, camera, cube, light, renderer, scene, zFar, zNear;
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(400, 400);
    container.append(renderer.domElement);
    renderer.setClearColorHex(0xEEEEEE, 1.0);
    renderer.clear();
    FOV = 45;
    VIEW_ASPECT_RATIO = 400 / 400;
    zNear = 1;
    zFar = 10000;
    camera = new THREE.PerspectiveCamera(FOV, VIEW_ASPECT_RATIO, zNear, zFar);
    camera.position.z = 300;
    scene = new THREE.Scene();
    cube = new THREE.Mesh(new THREE.CubeGeometry(50, 50, 50), new THREE.MeshLambertMaterial({
      map: texture
    }));
    scene.add(cube);
    scene.add(camera);
    light = new THREE.PointLight();
    light.position.set(170, 170, -60);
    scene.add(light);
    light = new THREE.PointLight();
    light.position.set(-170, 170, -60);
    scene.add(light);
    light = new THREE.PointLight();
    light.position.set(0, -170, 100);
    scene.add(light);
    animate = function(t) {
      cube.rotation.x = t / 1000;
      cube.rotation.y = t / 1600;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      return window.requestAnimationFrame(animate, renderer.domElement);
    };
    return animate(new Date().getTime());
  };

  makeTexture = function() {
    var texture;
    texture = new THREE.DataTexture(new Uint8Array(this.textureData.data), 400, 400);
    texture.needsUpdate = true;
    return texture;
  };

  $(function() {
    drawRGBTexture();
    return drawThreeScene($('#three'), makeTexture());
  });

}).call(this);
