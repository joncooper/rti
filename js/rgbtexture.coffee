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

$ ->
  canvas = $('#container > canvas')[0]
  context = canvas.getContext('2d')
  size = $('#container > canvas').width()

  textureData = makeRGBTexture(context, size)
  context.putImageData(textureData, 0, 0)
