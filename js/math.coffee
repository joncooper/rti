# Convenience math stuff

PI = 3.141592653589793

# Pull these functions into our scope for convenience
{ abs, atan2, acos, sqrt, cos, sin, pow, min, max, floor } = Math

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

# Clamp value into the range [0.0, 1.0] or [low, high]
clamp = (value, low=0.0, high=1.0) ->
  max(min(value, high), low)

# Clamp value into the range [0, 255]
clampUint8 = (value) ->
  max(min(floor(value), 255), 0)