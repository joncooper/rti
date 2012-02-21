vertexShader = """

varying vec2 pos;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos = uv;
}

"""

fragmentShader = """

varying vec2 pos;

uniform vec3 s0s1s2;
uniform vec3 s3s4s5;
uniform vec3 b0b1b2;
uniform vec3 b3b4b5;
uniform float Lu;
uniform float Lv;
uniform sampler2D luminanceCoefficients012;
uniform sampler2D luminanceCoefficients345;
uniform sampler2D chrominance;

void main() {
  vec4 a0a1a2 = texture2D(luminanceCoefficients012, pos);
  vec4 a3a4a5 = texture2D(luminanceCoefficients345, pos);

  // GLSL vector multiplication is componentwise

  a0a1a2.x = (a0a1a2.x - b0b1b2.x) * s0s1s2.x;
  a0a1a2.y = (a0a1a2.y - b0b1b2.y) * s0s1s2.y;
  a0a1a2.z = (a0a1a2.z - b0b1b2.z) * s0s1s2.z;

  a3a4a5.x = (a3a4a5.x - b3b4b5.x) * s3s4s5.x;
  a3a4a5.y = (a3a4a5.y - b3b4b5.y) * s3s4s5.y;
  a3a4a5.z = (a3a4a5.z - b3b4b5.z) * s3s4s5.z;

//  vec4 debug = vec4(pos.x, pos.y, 0.0, 1.0);

// intensity = (a0 * Lu^2) + (a1 * Lv^2) + (a2 * Lu * Lv) + (a3 * Lu) + (a4 * Lv) + a5;

  float intensity = dot(a0a1a2, vec4(Lu*Lu, Lv*Lv, Lu*Lv, 0.0)) + dot(a3a4a5, vec4(Lu, Lv, 1.0, 0.0));
  vec4 rgb = texture2D(chrominance, pos);

  gl_FragColor.r = intensity * rgb.r;
  gl_FragColor.g = intensity * rgb.g;
  gl_FragColor.b = intensity * rgb.b;
  gl_FragColor.a = 1.0;

}

"""

# Build the set of uniforms that will be passed to the shaders

buildUniforms = (ptm) ->
  lightCoordinates = { u: 0.1, v: 0.1 }

  # Turn a raw texture buffer into a THREE (and GL) texture, and push it to the GPU
  makeTexture = (uint8textureData) =>
    t = new THREE.DataTexture(uint8textureData, ptm.width, ptm.height, THREE.RGBFormat)
    t.needsUpdate = true
    return t

  uniforms =
    b0b1b2:
      type: 'v3'
      value: new THREE.Vector3(ptm.bias[0]/255.0, ptm.bias[1]/255.0, ptm.bias[2]/255.0)
    b3b4b5:
      type: 'v3'
      value: new THREE.Vector3(ptm.bias[3]/255.0, ptm.bias[4]/255.0, ptm.bias[5]/255.0)
    s0s1s2:
      type: 'v3'
      value: new THREE.Vector3(ptm.scale[0], ptm.scale[1], ptm.scale[2])
    s3s4s5:
      type: 'v3'
      value: new THREE.Vector3(ptm.scale[3], ptm.scale[4], ptm.scale[5])
    Lu:
      type: 'f'
      value: lightCoordinates.u
    Lv:
      type: 'f'
      value: lightCoordinates.v
    luminanceCoefficients012:
      type: 't'
      value: 0
      texture: makeTexture(ptm.tex0)
    luminanceCoefficients345:
      type: 't'
      value: 1
      texture: makeTexture(ptm.tex1)
    chrominance:
      type: 't'
      value: 2
      texture: makeTexture(ptm.tex2)

  return uniforms

#### Draw the scene and attach mouse handlers
drawScene = (ptm) ->

  # Attach the renderer
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(ptm.width, ptm.height)
  $('#three').append(renderer.domElement)
  renderer.setClearColorHex(0x555555, 1.0)
  renderer.clear()
  canvas = $('#three > canvas')[0]

  # Set up the scene
  scene = new THREE.Scene()
  # camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0)
  camera.position.z = 100.0
  scene.add(camera)

  # Bind the uniforms and shaders to the plane we'll use for display
  uniforms = buildUniforms(ptm)
  @material = new THREE.ShaderMaterial(
    uniforms: uniforms
    fragmentShader: fragmentShader
    vertexShader: vertexShader
  )

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1, 1)
    @material
  )
  plane.scale.x = 2.0
  plane.scale.y = 2.0

  # Complete building the scene
  scene.add(plane)
  scene.add(camera)

  # Fired every animation tick
  animate = (t) ->
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate, renderer.domElement)

  animate(new Date().getTime())

#### Load and display an RTI file

loadAndDisplay = (url) ->
  $('#three > canvas').remove()
  $('#three').addClass('loading')

  rtiFile = new BinaryFile(url)
  rtiFile.load ->
    rti = new RTI(new DataViewStream(rtiFile.dataStream))
    #### Parse and draw the scene
    rti.parse ->
      $('#three').removeClass('loading')
      drawScene(rti)

window.setL = (lu, lv) ->
  @material.uniforms.Lu.value = lu
  @material.uniforms.Lv.value = lv

#### Entry point

drawChrominanceData = (ptm) ->
  $('#three').append('<canvas></canvas>')
  canvas = $('#three > canvas')[0]
  canvas.width = ptm.width
  canvas.height = ptm.height
  context = canvas.getContext('2d')
  pixelData = context.createImageData(ptm.width, ptm.height)
  for y in [0...ptm.height]
    for x in [0...ptm.width]
      i = (((ptm.height - 1) - y) * ptm.width * 4) + (x * 4)
      j = (y * ptm.width * 3) + (x * 3)
      pixelData.data[i]   = ptm.tex2[j]
      pixelData.data[i+1] = ptm.tex2[j+1]
      pixelData.data[i+2] = ptm.tex2[j+2]
      pixelData.data[i+3] = 255
  context.putImageData(pixelData, 0, 0)

$ ->
  ptmFile = new BinaryFile('rti/WLR-tbird-no-distortion_1000.ptm')
  ptmFile.load ->
    ptm = new PTM(new DataViewStream(ptmFile.dataStream))
    ptm.parse ->
      drawScene(ptm)
