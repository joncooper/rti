$ ->
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(400, 400)
  $('#three').append(renderer.domElement)
  renderer.setClearColorHex(0x555555, 1.0)
  renderer.clear()

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0)
  camera.position.z = 100.0
  scene.add(camera)

  glsl_vs1 = """

varying vec2 pos;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos = uv;
}

"""

  glsl_fs1 = """

varying vec2 pos;
uniform sampler2D tex0;
uniform sampler2D tex1;

void main() {
  vec4 t0 = texture2D(tex0, pos);
  t0.a = 0.5;

  vec4 t1 = texture2D(tex1, pos);
  t1.a = 0.5;

  vec4 emitColor = mix(t0, t1, 0.5);
  emitColor.a = 1.0;

  gl_FragColor = emitColor;
}

"""

  uniforms =
    tex0:
      type: 't'
      value: 0
      texture: THREE.ImageUtils.loadTexture('/shaders/lets-eat-grandma.jpg')
    tex1:
      type: 't'
      value: 1
      texture: THREE.ImageUtils.loadTexture('/shaders/igloo.jpg')

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.80, 1.80, 1, 1)
    new THREE.ShaderMaterial
      uniforms: uniforms
      fragmentShader: glsl_fs1
      vertexShader: glsl_vs1
  )

  scene.add(plane)
  scene.add(camera)

  animate = (t) ->
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
    requestAnimationFrame(animate, renderer.domElement)

  animate(new Date().getTime())
