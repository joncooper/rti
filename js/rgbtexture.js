(function() {
  var makeRGBTexture;

  makeRGBTexture = function(context, size) {
    var b, base_offset, column, g, imageData, r, row, x, y;
    imageData = context.createImageData(size, size);
    for (x = 0; 0 <= size ? x < size : x > size; 0 <= size ? x++ : x--) {
      for (y = 0; 0 <= size ? y < size : y > size; 0 <= size ? y++ : y--) {
        base_offset = (size * 4 * y) + (4 * x);
        column = Math.floor((x / size) * 2);
        row = Math.floor((y / size) * 2);
        r = column === 1 && row === 0 ? 220 : 0;
        g = column === 1 && row === 1 ? 220 : 0;
        b = column === 0 && row === 1 ? 220 : 0;
        imageData.data[base_offset + 0] = r;
        imageData.data[base_offset + 1] = g;
        imageData.data[base_offset + 2] = b;
        imageData.data[base_offset + 3] = 255;
      }
    }
    return imageData;
  };

  $(function() {
    var canvas, context, size, textureData;
    canvas = $('#container > canvas')[0];
    context = canvas.getContext('2d');
    size = $('#container > canvas').width();
    textureData = makeRGBTexture(context, size);
    return context.putImageData(textureData, 0, 0);
  });

}).call(this);
