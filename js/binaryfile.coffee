class BinaryFile

  constructor: (@url) ->
    @xhr = new XMLHttpRequest()
    @xhr.open('GET', @url, true)
    @xhr.responseType = 'arraybuffer'
    @xhr.onload = (e) =>
      @buffer = @xhr.response

  onLoaded: =>
    @dataStream = new DataView(@buffer)
    console.log "Loaded file: #{@buffer.byteLength} bytes"
    @completionHandler()

  load: (completionHandler) ->
    @completionHandler = completionHandler
    @xhr.addEventListener('load', @onLoaded, false)
    @xhr.send(null)

window.jdc ?= {}
window.jdc.BinaryFile = BinaryFile
