makeRGBTexture = (context, size) ->
  imageData = context.createImageData(size, size)

  for x in [0...size]
    for y in [0...size]
      # 4 BPP
      base_offset   = (size * 4 * y) + (4 * x)
      column        = Math.floor ((x / size) * 2)
      row           = Math.floor ((y / size) * 2)

      r = if (column is 1 and row is 0) then 220 else 0
      g = if (column is 1 and row is 1) then 220 else 0
      b = if (column is 0 and row is 1) then 220 else 0

      imageData.data[base_offset+0] = r
      imageData.data[base_offset+1] = g
      imageData.data[base_offset+2] = b
      imageData.data[base_offset+3] = 255

  return imageData

drawRGBTexture = ->
  canvas = $('#rgbtexture > canvas')[0]
  context = canvas.getContext('2d')
  size = $('#rgbtexture > canvas').width()

  @textureData = makeRGBTexture(context, size)
  context.putImageData(@textureData, 0, 0)

drawThreeScene = (container, texture) ->
  renderer = new THREE.WebGLRenderer(antialias: true)
  renderer.setSize(400, 400)
  container.append(renderer.domElement)
  renderer.setClearColorHex(0xEEEEEE, 1.0)
  renderer.clear()
  FOV = 45
  VIEW_ASPECT_RATIO = 400/400
  zNear = 1
  zFar = 10000
  camera = new THREE.PerspectiveCamera(FOV, VIEW_ASPECT_RATIO, zNear, zFar)
  camera.position.z = 300
  scene = new THREE.Scene()
  cube = new THREE.Mesh(new THREE.CubeGeometry(50,50,50),
                        new THREE.MeshLambertMaterial(map: texture))
  scene.add(cube)
  scene.add(camera)

  light = new THREE.PointLight()
  light.position.set(170,170,-60)
  scene.add(light)

  light = new THREE.PointLight()
  light.position.set(-170,170,-60)
  scene.add(light)

  light = new THREE.PointLight()
  light.position.set(0,-170,100)
  scene.add(light)


  animate = (t) ->
    cube.rotation.x = t/1000
    cube.rotation.y = t/1600
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate, renderer.domElement)

  animate(new Date().getTime())

makeTexture = ->
  texture = new THREE.DataTexture(new Uint8Array(@textureData.data), 400, 400)
  texture.needsUpdate = true
  return texture

$ ->
  drawRGBTexture()
  # drawThreeScene($('#three'), makeTexture())
