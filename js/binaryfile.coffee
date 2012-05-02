# Download a file into a DataView backed by an ArrayBuffer.
# Helpful if you need to parse a binary file format.

class BinaryFile

  constructor: (@url, @progressHandler) ->
    @xhr = new XMLHttpRequest()
    @xhr.open('GET', @url, true)
    @xhr.responseType = 'arraybuffer'
    @xhr.onload = (e) =>
      @buffer = @xhr.response

  onProgress: (e) =>
    if e.lengthComputable
      @progressHandler("Loading", e.loaded, e.total)
      console.log "#{e.loaded} of #{e.total}"

  onLoaded: =>
    @dataStream = new DataView(@buffer)
    console.log "Loaded file: #{@buffer.byteLength} bytes"
    @completionHandler()

  load: (completionHandler) ->
    @completionHandler = completionHandler
    @xhr.addEventListener('load', @onLoaded, false)
    @xhr.addEventListener('progress', @onProgress, false)
    @xhr.send(null)
