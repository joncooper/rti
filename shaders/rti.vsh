attribute vec4 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

// Matrices in GLSL are column-major, so this is confusing - each line here is a column

mat4 projectionMatrix = mat4( 2.0/1.0,	0.0,		0.0,	-1.0,
                              0.0,		2.0/1.0,	0.0,	-1.0,
                              0.0,		0.0,		-1.0,	0.0,
                              0.0,		0.0,		0.0,	1.0);

void main()
{
	gl_Position = a_position;
	gl_Position *= projectionMatrix;
	
	// Set texture coordinates
	v_texCoord = a_texCoord;
}
