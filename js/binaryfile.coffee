class BinaryFile

  constructor: (@url) ->
    @xhr = new XMLHttpRequest()
    @xhr.open('GET', @url, true)
    @xhr.responseType = 'arraybuffer'
    @xhr.onload = (e) =>
      @buffer = @xhr.response

  onProgress: (e) =>
    if e.lengthComputable
      console.log((e.loaded / e.total) * 100.0)

  onLoaded: =>
    @dataStream = new DataView(@buffer)
    console.log "Loaded file: #{@buffer.byteLength} bytes"
    @completionHandler()

  load: (completionHandler) ->
    @completionHandler = completionHandler
    @xhr.addEventListener('load', @onLoaded, false)
    @xhr.addEventListener('progress', @onProgress, false)
    @xhr.send(null)

window.jdc ?= {}
window.jdc.BinaryFile = BinaryFile
