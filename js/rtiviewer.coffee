#import "math.coffee"
#import "binaryfile.coffee"
#import "dataviewstream.coffee"
#import "rti.coffee"

vertexShader = """

varying vec2 pos;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos = uv;
}

"""

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

buildUniforms = (rti, theta, phi) ->

  @textureCache ?= rti.makeTextures()
  textures = @textureCache

  weights = rti.computeWeights(theta, phi)

  texify = (i) =>
    t = new THREE.DataTexture(textures[i], rti.width, rti.height, THREE.RGBFormat)
    t.needsUpdate = true
    return t

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
      texture: (texify(i) for i in [0...9])

  return uniforms

@uniforms = {}

drawScene = (rti) ->

  renderer = new THREE.WebGLRenderer()
  renderer.setSize(rti.width, rti.height)
  $('#three').append(renderer.domElement)
  renderer.setClearColorHex(0x555555, 1.0)
  renderer.clear()

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100.0)
  camera.position.z = 100.0
  scene.add(camera)

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

  scene.add(plane)
  scene.add(camera)

  moveHandler = (event) =>
    canvas = $('#three > canvas')[0]
    canvasOffset = $(canvas).offset()
    x = event.clientX + Math.floor(canvasOffset.left)
    y = event.clientY + Math.floor(canvasOffset.top) + 1

    x -= canvas.width / 2
    y *= -1
    y += canvas.height / 2

    min_axis = Math.min(canvas.width, canvas.height) / 2

    phi   = Math.atan2(y, x)
    r     = Math.min(Math.sqrt(x*x + y*y), min_axis - 50) / min_axis # Clamp to radius of circle = min_axis
    lx    = r * Math.cos(phi)
    ly    = r * Math.sin(phi)
    lz    = Math.sqrt(1.0*1.0 - (lx*lx) - (ly*ly))

    # console.log "phi:   #{phi}"
    # console.log "r:     #{r}"
    # console.log "lx:    #{lx}"
    # console.log "ly:    #{ly}"
    # console.log "lz:    #{lz}"

    sphericalC = cartesianToSpherical(lx, ly, lz)

    # console.log "theta: #{sphericalC.theta}"
    # console.log "phi:   #{sphericalC.phi}"

    @material.uniforms.weights.value = rti.computeWeights(sphericalC.theta, sphericalC.phi)

  $('#three > canvas').mousemove(moveHandler)

  animate = (t) ->
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate, renderer.domElement)

  animate(new Date().getTime())

$ ->
  rtiFile = new jdc.BinaryFile('rti/coin.rti')
  rtiFile.load ->
    rti = new jdc.RTI(rtiFile.dataStream)
    rti.parse ->
      drawScene(rti)
