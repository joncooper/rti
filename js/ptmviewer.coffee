vertexShader = """

varying vec2 pos;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos = uv;
}

"""

# We have to rehydrate the coefficients in the shader, even though they are invariant over lighting direction.
# Why? We can't pass a floating-point texture with vanilla GLSL.
#
# We need floats per pixel; imagine we have a pixel that looks like:
#    raw coefficient = 44
#    bias            = 234
#    scale           = 2.0
# We compute a 'rehydrated' coefficient that is == -380. Which is unfortunately not expressible as a uint8.
#
# The options are: implement a floating-point encoding scheme like IEEE 754, or just rely on the fact that the GPU is fast :)
# An additional multiply and a subtract per pixel never hurt anyone!

fragmentShader = """

varying vec2 pos;

uniform vec3 s0s1s2;
uniform vec3 s3s4s5;
uniform vec3 b0b1b2;
uniform vec3 b3b4b5;
uniform float Lu;
uniform float Lv;
uniform int drawNormalsMode;
uniform float diffuseGain;
uniform sampler2D luminanceCoefficients012;
uniform sampler2D luminanceCoefficients345;
uniform sampler2D chrominance;

// See http://www.hpl.hp.com/research/ptm/papers/Eq19Correction.pdf

vec2 maximumLuminance(in vec4 a0a1a2, in vec4 a3a4a5) {
  highp float a0, a1, a2, a3, a4, a5;
  a0 = a0a1a2.x;
  a1 = a0a1a2.y;
  a2 = a0a1a2.z;
  a3 = a3a4a5.x;
  a4 = a3a4a5.y;
  a5 = a3a4a5.z;

  float lu0 = ((a2 * a4) - (2.0 * a1 * a3)) / ((4.0 * a0 * a1) - (a2 * a2));
  float lv0 = ((a2 * a3) - (2.0 * a0 * a4)) / ((4.0 * a0 * a1) - (a2 * a2));
  return vec2(lu0, lv0);
}

vec3 recoveredSurfaceNormal(in vec4 a0a1a2, in vec4 a3a4a5) {
  vec2 maxL = maximumLuminance(a0a1a2, a3a4a5);
  float normalZ = sqrt(1.0 - (maxL.x * maxL.x) - (maxL.y * maxL.y));
  vec3 recoveredNormal = vec3(maxL, normalZ);
  return recoveredNormal;
}

void applyDiffuseGain(float gain, inout vec4 a0a1a2, inout vec4 a3a4a5) {
  highp float a0, a1, a2, a3, a4, a5, a0p, a1p, a2p, a3p, a4p, a5p, lu0, lv0;
  vec2 maxL;

  a0 = a0a1a2.x;
  a1 = a0a1a2.y;
  a2 = a0a1a2.z;
  a3 = a3a4a5.x;
  a4 = a3a4a5.y;
  a5 = a3a4a5.z;

  maxL = maximumLuminance(a0a1a2, a3a4a5);
  lu0 = maxL.x;
  lv0 = maxL.y;

  a0p = gain * a0;
  a1p = gain * a1;
  a2p = gain * a2;
  a3p = (1.0 - gain) * ((2.0 * a0 * lu0) + (a2 * lv0)) + a3;
  a4p = (1.0 - gain) * ((2.0 * a1 * lv0) + (a2 * lu0)) + a4;
  a5p = (1.0 - gain) * ((a0 * lu0 * lu0) + (a1 * lv0 * lv0) + (a2 * lu0 * lv0)) + ((a3 - a3p) * lu0) + ((a4 - a4p) * lv0) + a5;

  a0a1a2 = vec4(a0p, a1p, a2p, 0.0);
  a3a4a5 = vec4(a3p, a4p, a5p, 0.0);
  return;
}

void main() {
  vec4 a0a1a2 = texture2D(luminanceCoefficients012, pos);
  vec4 a3a4a5 = texture2D(luminanceCoefficients345, pos);

  // GLSL vector operations are componentwise

  a0a1a2.xyz = (a0a1a2.xyz - b0b1b2.xyz) * s0s1s2.xyz;
  a3a4a5.xyz = (a3a4a5.xyz - b3b4b5.xyz) * s3s4s5.xyz;

  if (diffuseGain > 0.0) {
    applyDiffuseGain(diffuseGain, a0a1a2, a3a4a5);
  }

  // intensity = (a0 * Lu^2) + (a1 * Lv^2) + (a2 * Lu * Lv) + (a3 * Lu) + (a4 * Lv) + a5;

  float intensity = dot(a0a1a2, vec4(Lu*Lu, Lv*Lv, Lu*Lv, 0.0)) + dot(a3a4a5, vec4(Lu, Lv, 1.0, 0.0));
  vec4 rgb = texture2D(chrominance, pos);

  gl_FragColor = rgb * intensity;
  gl_FragColor.a = 1.0;

  if (drawNormalsMode == 1) {
    gl_FragColor = vec4(recoveredSurfaceNormal(a0a1a2, a3a4a5), 1.0);
  }
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
    drawNormalsMode:
      type: 'i'
      value: 0
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
    diffuseGain:
      type: 'f'
      value: 0.0

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

    # Map (x,y) on the canvas from space [(0, width), (0, height)] -> [(-1, 1), (1, -1)]
  canvasPointToLightSpacePoint = (x, y) ->
    x = ((x / canvas.width)  * 2) - 1
    y = (((y / canvas.height) * 2) - 1) * -1
    return [x, y]

  #### Bind mouse handlers

  # Mouse move handler - relight based upon mouse position
  moveHandler = (event) =>
    return if @dragging
    [x, y] = canvasPointToLightSpacePoint(event.offsetX, event.offsetY)

    phi   = Math.atan2(y, x)
    r     = Math.min(Math.sqrt(x*x + y*y), 1) / 1
    lx    = r * Math.cos(phi)
    ly    = r * Math.sin(phi)

    @material.uniforms.Lu.value = lx
    @material.uniforms.Lv.value = ly

  # Drag handler - pan
  panHandler = (event) ->
    deltaX = event.offsetX - @dragStart.x
    deltaY = event.offsetY - @dragStart.y
    plane.position.x = planeStart.x + ((deltaX / (canvas.width * plane.scale.x)) * (2.0 * plane.scale.x))
    plane.position.y = planeStart.y + ((-deltaY / (canvas.height * plane.scale.y)) * (2.0 * plane.scale.y))

  $(canvas).mousedown (event) =>
    @dragging = true
    @dragStart = {x: event.offsetX, y: event.offsetY}
    @planeStart = {x: plane.position.x, y: plane.position.y}

  $(canvas).mousemove (event) =>
    return unless @dragging
    panHandler(event)

  $(canvas).mouseup (event) =>
    @dragging = false

  # Zoom handler - zoom in/out
  zoomHandler = (deltaY) ->
    plane.scale.x += (deltaY * 0.05)
    plane.scale.x = Math.max(plane.scale.x, 1.0)
    plane.scale.y = plane.scale.x

  $('#three > canvas').mousemove(moveHandler)
  $('#three > canvas').mousewheel (event, delta, deltaX, deltaY) =>
    zoomHandler(deltaY)

  # Fired every animation tick
  animate = (t) ->
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate, renderer.domElement)

  animate(new Date().getTime())

#### In lieu of a UI, I give you ... window functions!

window.setG = (gain) ->
  @material.uniforms.diffuseGain.value = gain

window.setL = (lu, lv) ->
  @material.uniforms.Lu.value = lu
  @material.uniforms.Lv.value = lv

window.toggleDrawNormalsMode = ->
  @material.uniforms.drawNormalsMode.value = (@material.uniforms.drawNormalsMode.value + 1) % 2

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
#  ptmFile = new BinaryFile('rti/Ban-Papyrus_1000.ptm')
  ptmFile.load ->
    ptm = new PTM(new DataViewStream(ptmFile.dataStream))
    ptm.parse ->
      drawScene(ptm)
