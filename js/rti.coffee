# Parse RTI files
# See http://c-h-i.org/technology/ptm/ptm.html
# See doc/universal_rti_format_draft.doc
class RTI

  # Takes a DataViewStream
  constructor: (@dataStream, @LOG=false) ->

  # Fired periodically while parsing
  onParsing: (event) =>
    console.log "RTI parsed #{event.parsed} of #{event.total}" if @LOG

  parse: (completionHandler) =>
    @parseHSH()
    completionHandler()

  # Returns the index of an element in the coefficient array
  # h - y position of the current pixel
  # w - x position of the current pixel
  # b - the current color channel
  # o - the current term (keep in mind there are order*order terms)

  getIndex: (h, w, b, o) ->
    h * (@width * @bands * @order * @order) + w * (@bands * @order * @order) + b * (@order * @order) + o

  # Parses the RTI file
  #
  # Sets: @coefficients: Uint8Array(width * height * color channels * polynomial terms)
  # Sets: @weights:      Float32Array(terms)
  # Sets: @scale:        Float32Array(terms)
  # Sets: @bias:         Float32Array(terms)
  # Sets: @width, @height

  parseHSH: ->
    # strip all lines beginning with #
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
    @coefficients = new Uint8Array(@width * @height * @bands * @terms)

    # Read the scale values
    @scale = new Float32Array(@terms)
    @scale[i] = @dataStream.readFloat() for i in [0...@terms]

    # Read the bias values
    @bias  = new Float32Array(@terms)
    @bias[i] = @dataStream.readFloat() for i in [0...@terms]

    # Read the main data block
    for y in [0...@height]
      for x in [0...@width]
        for b in [0...@bands]
          for t in [0...@terms]
            # Populate the coefficients array
            @coefficients[@getIndex(y, x, b, t)] = @dataStream.readUint8()
      # Fire parsing event per-row
      @onParsing({ total: @height, parsed: y})

  # Compute weights based on the lighting direction
  computeWeights: (theta, phi) ->

    weights = new Float32Array(16)

    phi = phi + (2 * PI) if phi < 0

    weights[0]  = 1/sqrt(2*PI)
    weights[1]  = sqrt(6/PI)      * (cos(phi)*sqrt(cos(theta)-cos(theta)*cos(theta)))
    weights[2]  = sqrt(3/(2*PI))  * (-1 + 2*cos(theta))
    weights[3]  = sqrt(6/PI)      * (sqrt(cos(theta) - cos(theta)*cos(theta))*sin(phi))

    weights[4]  = sqrt(30/PI)     * (cos(2*phi)*(-cos(theta) + cos(theta)*cos(theta)))
    weights[5]  = sqrt(30/PI)     * (cos(phi)*(-1 + 2*cos(theta))*sqrt(cos(theta) - cos(theta)*cos(theta)))
    weights[6]  = sqrt(5/(2*PI))  * (1 - 6*cos(theta) + 6*cos(theta)*cos(theta))
    weights[7]  = sqrt(30/PI)     * ((-1 + 2*cos(theta))*sqrt(cos(theta) - cos(theta)*cos(theta))*sin(phi))
    weights[8]  = sqrt(30/PI)     * ((-cos(theta) + cos(theta)*cos(theta))*sin(2*phi))

    weights[9]  = 2*sqrt(35/PI)   * cos(3*phi)*pow(cos(theta) - cos(theta)*cos(theta),(3/2))
    weights[10] = (sqrt(210/PI)   * cos(2*phi)*(-1 + 2*cos(theta))*(-cos(theta) + cos(theta)*cos(theta)))
    weights[11] = 2*sqrt(21/PI)   * cos(phi)*sqrt(cos(theta) - cos(theta)*cos(theta))*(1 - 5*cos(theta) + 5*cos(theta)*cos(theta))
    weights[12] = sqrt(7/(2*PI))  * (-1 + 12*cos(theta) - 30*cos(theta)*cos(theta) + 20*cos(theta)*cos(theta)*cos(theta))
    weights[13] = 2*sqrt(21/PI)   * sqrt(cos(theta) - cos(theta)*cos(theta))*(1 - 5*cos(theta) + 5*cos(theta)*cos(theta))*sin(phi)
    weights[14] = (sqrt(210/PI)   * (-1 + 2*cos(theta))*(-cos(theta) + cos(theta)*cos(theta))*sin(2*phi))
    weights[15] = 2*sqrt(35/PI)   * pow(cos(theta) - cos(theta)*cos(theta),(3/2))*sin(3*phi)

    return weights

  # Render the RTI into an ImageData and blit it into a canvas context
  # (lx, ly, lz) need to be on the surface of a sphere centered at the origin with radius 1.
  renderImageHSH: (context, lx, ly, lz) ->

    sCoord = cartesianToSpherical(lx, ly, lz)
    weights = @computeWeights(sCoord.theta, sCoord.phi)

    console.log "Rendering:    #{@width} x #{@height}"
    console.log "(lx, ly, lz): (#{lx}, #{ly}, #{lz})"
    console.log "Context:      #{context}"

    context.clearRect(0, 0, @width, @height)
    imagePixelData = context.createImageData(@width, @height)
    # we are going to emit RGBA, not RGB
    outputBands = 4 

    for j in [0...@height]
      for i in [0...@width]
        # The computation for a single pixel
        for b in [0...@bands]
          # The computation for a single color channel on a single pixel
          value = 0.0
          # Multiply and sum the coefficients with the weights.
          # This evaluates the polynomial function we use for lighting
          for t in [0...(@terms)]
            value += ((@coefficients[@getIndex(j,i,b,t)] / 255) * @scale[t] + @bias[t]) * weights[t]
          value = clamp(value)
          # Set the computed pixel color for that pixel, color channel
          imagePixelData.data[j*@width*outputBands+i*outputBands+b] = value * 255
        # Set the alpha channel
        imagePixelData.data[(j*@width*outputBands) + (i*outputBands) + 3] = 255

    window.imagePixelData = imagePixelData
    context.putImageData(imagePixelData, 0, 0)

  # Build texture layers (one polynomial term per layer) for processing in GLSL shader
  makeTextures: ->
    textures = []
    for term in [0...@terms]
      textureData = new Uint8Array(@width * @height * @bands)
      i = 0
      for y in [0...@height]
        for x in [0...@width]
          for channel in [0...@bands]
            textureData[i] = @coefficients[@getIndex(y,x,channel,term)]
            i += 1
      textures[term] = textureData
    return textures
