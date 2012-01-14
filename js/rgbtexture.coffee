drawRGBTexture = (context) ->
  size = 32
  bpp  = 4
  alpha = 255
  max_intensity = 210
  min_intensity = 50

  intensity = (pct) ->
    return Math.floor(min_intensity + (max_intensity - min_intensity))

  square_size = size / 3

  imageData = context.createImageData(size, size)

  for x in [0..size]
    for y in [0..size]
      base_offset   = (size * bpp * y) + (bpp * x)
      column        = Math.floor (x / square_size)
      row           = Math.floor (y / square_size)
      row_intensity = intensity((2-row) / 2)

      r = if column is 0 then row_intensity else 0
      g = if column is 1 then row_intensity else 0
      b = if column is 2 then row_intensity else 0

      imageData[base_offset+0] = r
      imageData[base_offset+1] = g
      imageData[base_offset+2] = b
      imageData[base_offset+3] = alpha

      console.log(r,g,b,alpha)

  console.log imageData
  window.imgData = imageData
  return imageData

$ ->
  canvas = $('#container > canvas')[0]
  context = canvas.getContext('2d')
  drawRGBTexture(context)
