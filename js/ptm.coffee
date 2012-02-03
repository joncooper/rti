class PTM

  constructor: (@dataStream, @LOG=false) ->

  parse: (completionHandler) =>
    @parseHSH()
    completionHandler()

  # The PTM file format is unfortunately a bit janky.
  # See: http://www.hpl.hp.com/research/ptm/downloads/PtmFormat12.pdf
  parsePTM: ->
    # Read the header
    @headerString = @dataStream.readLine()
    assertEqual(@headerString, 'PTM_1.2', 'Cannot parse as PTM')

    # Read the specific PTM format (one of are 9 possible)
    @formatString = @dataStream.readLine()
    assertEqual(@formatString, 'PTM_FORMAT_LRGB', 'Cannot parse non-LRGB')

    # "The next line consists of an ASCII string containing the width and height of the PTM map in pixels.
    # It is legal to have a newline separating the width and the height." Oh goodie.

    [@width, @height] = @dataStream.readLine().split(" ")
    @height ?= @dataStream.readLine()

    # Read 6 scale values (ASCII representation of "floating point")
    # "A newline can be used between the scale values and the bias values"
    # Read 6 bias values (ASCII respresentation of "integer")

    tmp = @dataStream.readLine().split(" ")

    # Quick sanity check
    assert(tmp.length == 6 or tmp.length == 12, "Cannot parse scale/bias block")

    if tmp.length is 6
      @scale = [Number(s) for s in tmp]
      @bias  = [Number(b) for b in @dataStream.readLine().split(" ")
    else
      [@scale, @bias] = [[Number(s) for s in tmp[0...6]], [Number(b) for b in tmp[6...12]]]

    # PTM_FORMAT_LRGB data block
    # Note: these are stored little-endian
    # Block format is [a0, a1, a2, a3, a4, a5, r, g, b]
    # Where a0...5 are polynomial coefficients for the luminance polynomial and rgb are color values
    # These are stored in reverse-scanline order, which I interpret to mean from bottom left to bottom right, then up LTR
