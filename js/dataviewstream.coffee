# Add stream functionality to DataView.
# I'm aware of the arguments around extending native objects; I'm ok with it.

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
