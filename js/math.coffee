# Convenience math stuff

PI = 3.141592653589793

# Pull these functions into our scope for convenience
{ atan2, acos, sqrt, cos, sin, pow, min, max } = Math

# Convert spherical coordinates to cartesian coordinates
sphericalToCartesian = (r, theta, phi) ->
  {
    x: r * cos(phi) * sin(theta)
    y: r * sin(phi) * sin(theta)
    z: r * cos(theta)
  }

# Convert cartesian coordinates to spherical coordinates
# phi measures rotation around the xy plane
# theta measures rotation along the yz plane
cartesianToSpherical = (x, y, z) ->
  {
    r:     sqrt(x*x + y*y + z*z)
    theta: acos(z)
    phi:   atan2(y, x)
  }

# Clamp value into the range [0.0, 1.0]
clamp = (value) ->
  max(min(value, 1.0), 0.0)
