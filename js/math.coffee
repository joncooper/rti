PI = 3.141592653589793

{ atan2, acos, sqrt, cos, sin, pow, min, max } = Math

sphericalToCartesian = (r, theta, phi) ->
  {
    x: r * cos(phi) * sin(theta)
    y: r * sin(phi) * sin(theta)
    z: r * cos(theta)
  }

cartesianToSpherical = (x, y, z) ->
  {
    r:     sqrt(x*x + y*y + z*z)
    theta: acos(z)
    phi:   atan2(y, x)
  }
