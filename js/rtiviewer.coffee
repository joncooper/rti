# Load, parse and display the RTI file
#
# * Click and drag to pan
# * Scroll wheel to zoom
# * Move the mouse to relight

# The vertex shader (GLSL):
#
# * projects the geometry onto the view
# * passes on the texture coordinates as the varying vec2 pos
vertexShader = """

varying vec2 pos;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos = uv;
}

"""

# The fragment shader (GLSL) calculates each pixel's intensity by:
#
# * Sampling the coefficient from the texture array (which coerces it to a float)
# * Rehydrating it by applying the scale and bias
# * Multiplying it by the appropriate polynomial term weight
# * Summing those weighted, rehydrated coefficients
fragmentShader = """

varying vec2 pos;

uniform float scale[9];
uniform float bias[9];
uniform float weights[9];

uniform sampler2D rtiData[9];

void main() {

  gl_FragColor  = (texture2D(rtiData[0], pos) * scale[0] + bias[0]) * weights[0];
  gl_FragColor += (texture2D(rtiData[1], pos) * scale[1] + bias[1]) * weights[1];
  gl_FragColor += (texture2D(rtiData[2], pos) * scale[2] + bias[2]) * weights[2];
  gl_FragColor += (texture2D(rtiData[3], pos) * scale[3] + bias[3]) * weights[3];
  gl_FragColor += (texture2D(rtiData[4], pos) * scale[4] + bias[4]) * weights[4];
  gl_FragColor += (texture2D(rtiData[5], pos) * scale[5] + bias[5]) * weights[5];
  gl_FragColor += (texture2D(rtiData[6], pos) * scale[6] + bias[6]) * weights[6];
  gl_FragColor += (texture2D(rtiData[7], pos) * scale[7] + bias[7]) * weights[7];
  gl_FragColor += (texture2D(rtiData[8], pos) * scale[8] + bias[8]) * weights[8];
  gl_FragColor.a = 1.0;

}

"""

# Build the set of uniforms that will be passed to the shaders
#
# * texture array (rtiData)
# * bias
# * scale
# * weights
buildUniforms = (rti, theta, phi) ->

  # Pack coefficients for each term into an array of RGB tuples in a Uint8Array
  textures = rti.makeTextures()
  # Generate the initial weights given light coordinates
  weights = rti.computeWeights(theta, phi)

  # Turn a raw texture buffer into a THREE (and GL) texture, and push it to the GPU
  makeTexture = (i) =>
    t = new THREE.DataTexture(textures[i], rti.width, rti.height, THREE.RGBFormat)
    t.needsUpdate = true
    return t

  # Build the initial set of uniforms for our shader
  uniforms =
    bias:
      type: 'fv1'
      value: rti.bias
    scale:
      type: 'fv1'
      value: rti.scale
    weights:
      type: 'fv1'
      value: weights
    rtiData:
      type: 'tv'
      value: 0
      texture: (makeTexture(i) for i in [0...9])

  return uniforms

#### Draw the scene and attach mouse handlers
drawScene = (rti) ->

  # Attach the renderer
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(rti.width, rti.height)
  $('#three').append(renderer.domElement)
  renderer.setClearColorHex(0x555555, 1.0)
  renderer.clear()
  canvas = $('#three > canvas')[0]

  # Set up the scene
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0)
  camera.position.z = 100.0
  scene.add(camera)

  # Bind the uniforms and shaders to the plane we'll use for display
  uniforms = buildUniforms(rti, 0.0, PI)
  @material = new THREE.ShaderMaterial(
    uniforms: uniforms
    fragmentShader: fragmentShader
    vertexShader: vertexShader
  )

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0, 1, 1)
    @material
  )

  # Complete building the scene
  scene.add(plane)
  scene.add(camera)

  # Map (x,y) on the canvas from space [(0, width), (0, height)] -> [(-width/2, width/2), (height/2, -height/2)]
  centerCanvasPoint = (x, y) ->
    x -= canvas.width / 2
    y *= -1
    y += canvas.height / 2
    return [x, y]

  #### Bind mouse handlers

  # Mouse move handler - relight based upon mouse position
  moveHandler = (event) =>
    return if @dragging
    [x, y] = centerCanvasPoint(event.offsetX, event.offsetY)

    # Clamp light position (TODO: better to clamp theta?)
    min_axis = Math.min(canvas.width, canvas.height) / 2

    phi   = Math.atan2(y, x)
    r     = Math.min(Math.sqrt(x*x + y*y), min_axis - 50) / min_axis
    lx    = r * Math.cos(phi)
    ly    = r * Math.sin(phi)
    lz    = Math.sqrt(1.0*1.0 - (lx*lx) - (ly*ly))
    sphericalC = cartesianToSpherical(lx, ly, lz)

    @material.uniforms.weights.value = rti.computeWeights(sphericalC.theta, sphericalC.phi)

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

#### Load and display an RTI file

loadAndDisplay = (url) ->
  $('#three > canvas').remove()
  $('#three').addClass('loading')

  progressHandler = (message, loaded, total) ->
    $('progress').attr('value', loaded)
    $('progress').attr('max', total)

  rtiFile = new BinaryFile(url, progressHandler)
  rtiFile.load ->
    rti = new RTI(new DataViewStream(rtiFile.dataStream))
    #### Parse and draw the scene
    rti.parse ->
      $('#three').removeClass('loading')
      drawScene(rti)

#### Entry point

# $ ->
#   # Bind click handler
#   $('.rti-file-list a').click (e) ->
#     e.preventDefault()
#     loadAndDisplay($(e.target).attr('href'))

#   # Load initial RTI
#   loadAndDisplay('rti/coin.rti')
#
#
