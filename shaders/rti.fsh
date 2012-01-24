
// Set precision?
// precision mediump float

// Input varying should be interpolated texture coordinates from vertex shader

varying vec2 v_texCoord;

// Texture samplers, one per basis term
uniform sampler2D s_tex_term[9];

// Relighting weights
uniform double weights[16];

void main()
{
  vec4 emitColor;
  for (int i = 0; i < 9; i++) {
    emitColor += texture2D(s_tex_term[i], v_texCoord) * weights[i];
  }
  emitColor.a = 1.0;
  gl_FragColor = emitColor;
}
