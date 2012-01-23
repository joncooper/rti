DataView::pos = 0

DataView::stringFromUint8Slice = (startOffset, endOffset) ->
  getCharStr = (i) =>
    String.fromCharCode(@getUint8(i))
  (getCharStr(i) for i in [startOffset...endOffset]).join('')

DataView::mark = ->
  @markedPos = @pos

DataView::reset = ->
  @pos = @markedPos

DataView::peekLine = ->
  @mark()
  line = @readLine()
  @reset()
  return line

# Lines end with either LF (0x0a) or CRLF (0x0d0a).
DataView::readLine = ->
  if @pos >= @byteLength
    return null

  start = @pos
  end   = -1

  while (@pos < @byteLength) && (end < start)
    if @getUint8(@pos) is 0x0a
      if (@pos > 0) && (@getUint8(@pos-1) is 0x0d)
        end = @pos - 1
      else
        end = @pos
      @pos = @pos + 1
      return @stringFromUint8Slice(start, end)
    else
      @pos = @pos + 1
  return null

# Little-endian IEEE754 32-bit floats
DataView::readFloat = ->
  ret = @getFloat32(@pos, true)
  @pos = @pos + 4
  return ret

DataView::readUint8 = ->
  ret = @getUint8(@pos)
  @pos = @pos + 1
  return ret

assertEqual = (tested, expected, errorMessage) ->
  throw "Failed assertion: #{errorMessage}" if tested isnt expected

class RTI
  constructor: (@url) ->
    @loadFile()

  loadFile: ->
    xhr = new XMLHttpRequest()
    xhr.open('GET', @url, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = (e) =>
      @binaryFileBuffer = xhr.response
    xhr.addEventListener("load", @onLoaded, false)
    xhr.send(null)

  onLoaded: =>
    @dataStream = new DataView(@binaryFileBuffer)
    console.log "Loaded RTI file: #{@binaryFileBuffer.byteLength} bytes"
    console.log "Header:          #{@dataStream.peekLine()}"

  # Returns the index of an element in the HSHImage float array given the following arguments,
  # h - y position of the current pixel
  # w - x position of the current pixel
  # b - the current color channel
  # o - the current term (keep in mind there are order*order terms)

  getIndex: (h, w, b, o) ->
    h * (@width * @bands * @order * @order) + w * (@bands * @order * @order) + b * (@order * @order) + o

  # Returns a float array containing the entire RTI coefficient set. The order of elements in the float array is,
  # rtiheight*rtiwidth*bands*terms
  # (where terms = (order*order), for other variables check the comments above)

  # RTI file info : These variables are initialize in the loadHSH function
  # rtiwidth, rtiheight - Height and width of the loaded RTI
  # bands - Number of color channels in the image, usually 3
  # order - The order of the RTI reflectance model. The actual number of coefficients (i.e. terms) = order * order

  parseHSH: ->
    # strip all lines beginning with #; (used ifstream::infile.peek)
    @dataStream.readLine() while @dataStream.peekLine()[0] is '#'

    @file_type     = Number @dataStream.readLine()

    header_line_2  = @dataStream.readLine().split(" ")
    header_line_3  = @dataStream.readLine().split(" ")
    @width         = Number header_line_2[0]
    @height        = Number header_line_2[1]
    @bands         = Number header_line_2[2]
    @terms         = Number header_line_3[0]
    @basis_type    = Number header_line_3[1]
    @element_size  = Number header_line_3[2]

    console.log "Dimensions:   #{@width} x #{@height}"
    console.log "Bands:        #{@bands}"
    console.log "Terms:        #{@terms}"
    console.log "Basis Type:   #{@basis_type}"
    console.log "Element Size: #{@element_size}"

    assertEqual(@file_type, 3, "Cannot parse non-HSH file type #{@file_type}")

    @order = Math.sqrt(@terms)
    @hshpixels = new Float32Array(@width * @height * @bands * @order * @order)

    # Read the scale values
    @scale = new Float32Array(@terms)
    @scale[i] = @dataStream.readFloat() for i in [0...@terms]

    # Read the bias values
    @bias  = new Float32Array(@terms)
    @bias[i] = @dataStream.readFloat() for i in [0...@terms]

    # Read the main data block
    @tmpuc = new Uint8Array(@terms)
    for y in [0...@height]
      for x in [0...@width]
        for b in [0...@bands]
          @tmpuc[i] = @dataStream.readUint8() for i in [0...@terms]
          for t in [0...@terms]
            value = @tmpuc[t] / 255
            value = (value * @scale[t]) + @bias[t]
            @hshpixels[@getIndex(@height-1-y, x, b, t)] = value

PI = 3.14159265

$ ->
  rti = new RTI('rti/cuniform.rti')
  window.rti = rti
  window.assertEqual = assertEqual
