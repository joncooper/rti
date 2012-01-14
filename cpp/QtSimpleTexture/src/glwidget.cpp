/****************************************************************************
**
** Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies).
** All rights reserved.
** Contact: Nokia Corporation (qt-info@nokia.com)
**
** This file is part of the examples of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:LGPL$
** No Commercial Usage
** This file contains pre-release code and may not be distributed.
** You may use this file in accordance with the terms and conditions
** contained in the Technology Preview License Agreement accompanying
** this package.
**
** GNU Lesser General Public License Usage
** Alternatively, this file may be used under the terms of the GNU Lesser
** General Public License version 2.1 as published by the Free Software
** Foundation and appearing in the file LICENSE.LGPL included in the
** packaging of this file.  Please review the following information to
** ensure the GNU Lesser General Public License version 2.1 requirements
** will be met: http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html.
**
** In addition, as a special exception, Nokia gives you certain additional
** rights.  These rights are described in the Nokia Qt LGPL Exception
** version 1.1, included in the file LGPL_EXCEPTION.txt in this package.
**
** If you have questions regarding the use of this file, please contact
** Nokia at qt-info@nokia.com.
**
**
**
**
**
**
**
**
** $QT_END_LICENSE$
**
****************************************************************************/

#include "glwidget.h"
#include <QPainter>
#include <QPaintEngine>
#include <math.h>

#include "rtiutil.h"


GLWidget::GLWidget(QWidget *parent)
    : QGLWidget(parent)
{
    qtLogo = true;
    frames = 0;
    setAttribute(Qt::WA_PaintOnScreen);
    setAttribute(Qt::WA_NoSystemBackground);
    setAutoBufferSwap(false);
   // m_showBubbles = true;
#ifndef Q_WS_QWS
    setMinimumSize(300, 250);
#endif

    // Extra section : how to use the functions in rtiutil.h

    // initial light position
    lx = 1;
    ly = 1;
    lz = 1;

    // allocate memory for the array to be returned from renderImageHSH(),
    // this will contain the computed image
    displayimage = (unsigned char*)malloc(rtiwidth*rtiheight*3*sizeof(unsigned char));

    // Render a result image under the given lighting condition
    renderImageHSH(hshimage, displayimage);
}

GLWidget::~GLWidget()
{
}

void GLWidget::setScaling(int scale) {

    if (scale > 50)
        m_fScale = 1 + qreal(scale -50) / 50 * 0.5;
    else if (scale < 50)
        m_fScale =  1- (qreal(50 - scale) / 50 * 1/2);
    else 
      m_fScale = 1;
}

void GLWidget::setLogo() {
    qtLogo = true;
}

void GLWidget::setTexture() {
    qtLogo = false;
}


void GLWidget::initializeGL ()
{
    glClearColor(0.1f, 0.1f, 0.2f, 1.0f);

    const GLint tex_height = 3, tex_width = 4; // texture height and width
    GLint border = 0; // no texture border
    GLint mipmap_level = 0; // mipmap level is 0 for base image
    GLint internal_format = GL_RGB32F_ARB; // internal format opengl stores the image as, we want to use 32-bit floating point

    glGenTextures(3, m_fpTextures);     // generate three texture ids

    // first data layer
    float layer1[tex_height][tex_width] = {{100,0,0,200}
                                          ,{0,300,400,0}
                                          ,{0,0,500,0}};

    glBindTexture(GL_TEXTURE_2D, m_fpTextures[0]);	// bind first texture

    glTexImage2D(GL_TEXTURE_2D, mipmap_level, internal_format, tex_width, tex_height, border, GL_LUMINANCE, GL_FLOAT, layer1);	// Build texture using information in layer1
    // Note that GL_LUMINANCE is used here because there is only a single channel for the sake of simplicity, for 3 color channels use GL_RGB

    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST ); // Use GL_NEAREST so there is no interpolation, makes it easier to figure out whats going on
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST );

    // second data layer
    float layer2[tex_height][tex_width] = {{0,0,0,0}
                                          ,{5,5,5,5}
                                          ,{10,10,10,10}};

    glBindTexture(GL_TEXTURE_2D, m_fpTextures[1]);	// bind second texture

    glTexImage2D(GL_TEXTURE_2D, mipmap_level, internal_format, tex_width, tex_height, border, GL_LUMINANCE, GL_FLOAT, layer2);	// Build texture using information In layer2

    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST );
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST );



    QGLShader *vshader = new QGLShader(QGLShader::Vertex);
    const char *vsrc =
        "attribute highp vec4 vertex;\n"
        "attribute highp vec4 texCoord;\n"
        "uniform mediump mat4 matrix;\n"
        "varying highp vec4 texc;\n"
        "void main(void)\n"
        "{\n"
        "    gl_Position = vertex;\n"
        "    texc = texCoord;\n"
        "}\n";
    vshader->compileSourceCode(vsrc);

    QGLShader *fshader = new QGLShader(QGLShader::Fragment);
    const char *fsrc =
        "varying highp vec4 texc;\n"
        "uniform sampler2D tex1;\n"
        "uniform sampler2D tex2;\n"
        "void main(void)\n"
        "{\n"
        "    highp vec4 color = vec4(0.0,0.0,0.0,1.0);\n"
        "    color.r  = (texture2D(tex1, texc.st).r)/500.0;\n"
        "    color.g  = (texture2D(tex2, texc.st).r)/10.0;;\n"
        "    color.b  = 0.0;\n"
        "    gl_FragColor = color;\n"
        "}\n";
    fshader->compileSourceCode(fsrc);

    program.addShader(vshader);
    program.addShader(fshader);
    program.link();

    vertexAttr = program.attributeLocation("vertex");
    texCoordAttr = program.attributeLocation("texCoord");
    textureUniform1 = program.uniformLocation("tex1");
    textureUniform2 = program.uniformLocation("tex2");
}



void GLWidget::paintTexturedRectangle()
{
    GLfloat afVerticesFull[] = { -1, -1, -1,  1, -1, -1, 1, 1, -1,
                                 -1, -1, -1,  1, 1, -1, -1, 1, -1};

    GLfloat afNormalsFull[] = { 0,0,-1, 0,0,-1, 0,0,-1,
                                0,0,-1, 0,0,-1, 0,0,-1};

    GLfloat afTexCoordFull[] = { 0.0f,0.0f, 1.0f,0.0f, 1.0f,1.0f,
                                 0.0f,0.0f, 1.0f,1.0f, 0.0f,1.0f};

    program.setAttributeArray(vertexAttr, afVerticesFull, 3);
    program.setAttributeArray(texCoordAttr, afTexCoordFull, 2);

    // Multi-texturing, activate each texture we're going to use and set the uniform variable index to be passed into the shader
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, m_fpTextures[0]);
    program.setUniformValue(textureUniform1, 0);    // use texture unit 0

    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, m_fpTextures[1]);
    program.setUniformValue(textureUniform2, 1);    // use texture unit 1

    // Enable the vertex and the texture-coordinate arrays
    program.enableAttributeArray(vertexAttr);
    program.enableAttributeArray(texCoordAttr);

    // Draws a quad (made up of 2 triangles = 6 vertices)
    glDrawArrays(GL_TRIANGLES, 0, 6);

    program.disableAttributeArray(vertexAttr);
    program.disableAttributeArray(texCoordAttr);
}
void GLWidget::paintGL()
{
    QPainter painter;
    painter.begin(this);

    painter.beginNativePainting();

    glClearColor(0.1f, 0.1f, 0.2f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);


    glFrontFace(GL_CW);
    glCullFace(GL_FRONT);
    glEnable(GL_CULL_FACE);
    glEnable(GL_DEPTH_TEST);


    // Bind the vertex and fragment shader that we've created
    program.bind();

    paintTexturedRectangle();

    // Release the vertex and fragment shader. We could use several vertex / fragment shaders for different types of objects in this manner.
    program.release();

    glDisable(GL_DEPTH_TEST);
    glDisable(GL_CULL_FACE);

    painter.endNativePainting();


    // A small code snippet showing how to draw text on the OpenGL canvas
    QString framesPerSecond;
    framesPerSecond.setNum(frames /(time.elapsed() / 1000.0), 'f', 2);

    painter.setPen(Qt::white);

    painter.drawText(20, 40, framesPerSecond + " fps");

    painter.end();
    
    swapBuffers();


    if (!(frames % 100)) {
        time.start();
        frames = 0;
    }
    m_fAngle += 1.0f;
    frames ++;
}
