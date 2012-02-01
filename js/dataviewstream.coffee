# A stream wrapper for DataView

class DataViewStream

  # Takes a DataView, which provides a wrapper around ArrayBuffer to provide various unpacking options
  constructor: (@dataView) ->
    @pos = 0

  # Turn a slice of a Uint8Array into a string
  stringFromUint8Slice: (startOffset, endOffset) ->
    getCharStr = (i) =>
      String.fromCharCode(@dataView.getUint8(i))
    (getCharStr(i) for i in [startOffset...endOffset]).join('')

  # Mark the stream position
  mark: ->
    @markedPos = @pos

  # Reset to marked position in stream
  reset: ->
    @pos = @markedPos

  # Scan a line without moving the stream position
  peekLine: ->
    @mark()
    line = @readLine()
    @reset()
    return line

  # Lines end with either LF (0x0a) or CRLF (0x0d0a).
  # Note that this will scan until EOF looking for an end-of-line.
  readLine: ->
    if @pos >= @dataView.byteLength
      return null

    start = @pos
    end   = -1

    while (@pos < @dataView.byteLength) && (end < start)
      if @dataView.getUint8(@pos) is 0x0a
        if (@pos > 0) && (@dataView.getUint8(@pos-1) is 0x0d)
          end = @pos - 1
        else
          end = @pos
        @pos = @pos + 1
        return @stringFromUint8Slice(start, end)
      else
        @pos = @pos + 1
    return null

  # Little-endian IEEE754 32-bit floats
  readFloat: ->
    ret = @dataView.getFloat32(@pos, true)
    @pos = @pos + 4
    return ret

  readUint8: ->
    ret = @dataView.getUint8(@pos)
    @pos = @pos + 1
    return ret
