(function() {
  var drawRGBTexture;

  drawRGBTexture = function(context) {
    var alpha, b, base_offset, bpp, column, g, imageData, intensity, max_intensity, min_intensity, r, row, row_intensity, size, square_size, x, y;
    size = 32;
    bpp = 4;
    alpha = 255;
    max_intensity = 210;
    min_intensity = 50;
    intensity = function(pct) {
      return Math.floor(min_intensity + (max_intensity - min_intensity));
    };
    square_size = size / 3;
    imageData = context.createImageData(size, size);
    for (x = 0; 0 <= size ? x <= size : x >= size; 0 <= size ? x++ : x--) {
      for (y = 0; 0 <= size ? y <= size : y >= size; 0 <= size ? y++ : y--) {
        base_offset = (size * bpp * y) + (bpp * x);
        column = Math.floor(x / square_size);
        row = Math.floor(y / square_size);
        row_intensity = intensity((2 - row) / 2);
        r = column === 0 ? row_intensity : 0;
        g = column === 1 ? row_intensity : 0;
        b = column === 2 ? row_intensity : 0;
        imageData[base_offset + 0] = r;
        imageData[base_offset + 1] = g;
        imageData[base_offset + 2] = b;
        imageData[base_offset + 3] = alpha;
        console.log(r, g, b, alpha);
      }
    }
    console.log(imageData);
    window.imgData = imageData;
    return imageData;
  };

  $(function() {
    var canvas, context;
    canvas = $('#container > canvas')[0];
    context = canvas.getContext('2d');
    return drawRGBTexture(context);
  });

}).call(this);
