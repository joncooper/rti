String::strip = ->
  @.replace /\s+$/g, ""

class PTM

  constructor: (@dataStream, @LOG=false) ->

  parse: (completionHandler) =>
    @parsePTM()
    completionHandler()

  # The PTM file format is unfortunately a bit janky.
  # See: http://www.hpl.hp.com/research/ptm/downloads/PtmFormat12.pdf
  parsePTM: ->

    # Read the header
    @headerString = @dataStream.readLine().strip()
    assertEqual(@headerString, 'PTM_1.2', 'Cannot parse as PTM')

    # Read the specific PTM format (one of are 9 possible)
    @formatString = @dataStream.readLine().strip()
    assertEqual(@formatString, 'PTM_FORMAT_LRGB', 'Cannot parse non-LRGB')

    # "The next line consists of an ASCII string containing the width and height of the PTM map in pixels.
    # It is legal to have a newline separating the width and the height." Oh goodie.

    [@width, @height] = @dataStream.readLine().strip().split(" ")
    @height ?= @dataStream.readLine().strip()

    @width = Number(@width)
    @height = Number(@height)

    # debugger

    # Read 6 scale values (ASCII representation of "floating point")
    # "A newline can be used between the scale values and the bias values"
    # Read 6 bias values (ASCII respresentation of "integer")

    tmp = @dataStream.readLine().strip().split(" ")

    # Quick sanity check
    assert(tmp.length == 6 or tmp.length == 12, "Cannot parse scale/bias block")

    if tmp.length is 6
      @scale = (Number(s) for s in tmp)
      @bias  = (Number(b) for b in @dataStream.readLine().strip().split(" "))
    else
      [@scale, @bias] = [(Number(s) for s in tmp[0...6]), (Number(b) for b in tmp[6...12])]

    console.log "Height: #{@height}"
    console.log "Width:  #{@width}"
    console.log "Scale:  #{@scale}"
    console.log "Bias:   #{@bias}"

    # 49 48 52 32 50 52
    #
    # 4  2  4  2  2  4
    # 104 234 74 86 82 0

    # PTM_FORMAT_LRGB data block
    # PTM_1.1 block format is [a0, a1, a2, a3, a4, a5, r, g, b]{width * height} (uint8)
    # PTM_1.2 block format is [a0, a1, a2, a3, a4, a5]{width * height}[r,g,b]{width * height} (uint8)
    # Where a0...5 are polynomial coefficients for the luminance polynomial and rgb are color values
    # These are stored in reverse-scanline order, which I interpret to mean from bottom left to bottom right, then up LTR

    @tex0 = new Uint8Array(@height * @width * 3)
    @tex1 = new Uint8Array(@height * @width * 3)
    @tex2 = new Uint8Array(@height * @width * 3)

    # Read coefficients, and 'rehydrate' each one by applying the transformation:
    #    coefficient = (raw_coefficient - bias) * scale
    # The 'rehydrated' coefficient is clamped into [0, 255].

    finalize = (i) =>
      c = @dataStream.readUint8()
      return c
      # b = @bias[i]
      # s = @scale[i]
      # cb = clampUint8(c - b)
      # sbs = clampUint8(cb * s)
      # return sbs

    for y in [0...@height]
      for x in [0...@width]
        offset = ((@height - 1 - y) * @width * 3) + (x * 3)
        @tex0[offset]   = finalize(0)
        @tex0[offset+1] = finalize(1)
        @tex0[offset+2] = finalize(2)
        @tex1[offset]   = finalize(3)
        @tex1[offset+1] = finalize(4)
        @tex1[offset+2] = finalize(5)
        if ((y % 100) is 0) and (x is 500)
          console.log @tex0[offset], @tex0[offset+1], @tex0[offset+2]
          console.log @tex1[offset], @tex1[offset+1], @tex1[offset+2]

    for y in [0...@height]
      for x in [0...@width]
        offset = ((@height - 1 - y) * @width * 3) + (x * 3)
        @tex2[offset]   = @dataStream.readUint8() # r
        @tex2[offset+1] = @dataStream.readUint8() # g
        @tex2[offset+2] = @dataStream.readUint8() # b
