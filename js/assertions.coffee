assertEqual = (tested, expected, errorMessage) ->
  throw "Failed assertion: #{errorMessage}" if tested isnt expected
