(function() {
  var PI, acos, atan2, cartesianToSpherical, clamp, cos, max, min, pow, sin, sphericalToCartesian, sqrt;

  PI = 3.141592653589793;

  atan2 = Math.atan2, acos = Math.acos, sqrt = Math.sqrt, cos = Math.cos, sin = Math.sin, pow = Math.pow, min = Math.min, max = Math.max;

  sphericalToCartesian = function(r, theta, phi) {
    return {
      x: r * cos(phi) * sin(theta),
      y: r * sin(phi) * sin(theta),
      z: r * cos(theta)
    };
  };

  cartesianToSpherical = function(x, y, z) {
    return {
      r: sqrt(x * x + y * y + z * z),
      theta: acos(z),
      phi: atan2(y, x)
    };
  };

  clamp = function(value, low, high) {
    if (low == null) low = 0.0;
    if (high == null) high = 1.0;
    return max(min(value, high), low);
  };

}).call(this);
