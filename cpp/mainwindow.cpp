#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "rtiutil.h"
#include <QMouseEvent>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    // loads the RTI file 'coin.rti' which should be in the project working folder for the code to run.
    hshimage=loadHSH("coin.rti");

    // set the current window size to the loaded RTI height and width
    this->resize(rtiwidth,rtiheight);

    // create a blank QImage with the same dimensions as the RTI so we can fill it up once we render under a new light position
    image = QImage(rtiwidth,rtiheight,QImage::Format_RGB888);

    // initial light position
    lx = 1;
    ly = 1;
    lz = 1;

    // allocate memory for the array to be returned from renderImageHSH(),
    // this will contain the computed image before being copied over to the QImage
    displayimage = (unsigned char*)malloc(rtiwidth*rtiheight*3*sizeof(unsigned char));

    // Render a result image under the given lighting condition
    renderImageHSH(hshimage, displayimage);
}

MainWindow::~MainWindow()
{
    free(hshimage);
    free(displayimage);
    delete ui;
}

void MainWindow::mousePressEvent(QMouseEvent* event)
{
    int x, y;
    x = event->x()-ui->imageLabel->x();
    y = event->y()-ui->imageLabel->y();

    float midx = (float)width()/2.0;
    float midy = (float)height()/2.0;
    float radius = min(midx,midy);

    // compute a new lighting angle depening on where the mouse was clicked.
    // you can change this way of selecting the lighting direction
    // also keep in mind that the light vector (lx, ly, lz) must be normalized.
    lx = (x-midx)/(float)radius;
    ly = (y-midy)/(float)radius;
    lz = sqrt(1-lx*lx-ly*ly);
    // Note that we donot prevent user from clicking outside the circle specified by 'radius'
    // This leads to undefinied lz values resulting in a blank image being displayed.
    // Clamp the coordinates appropriately.


    // Render a result image under the given lighting condition
    renderImageHSH(hshimage, displayimage);

    // copy the resulting display image (which is in a char array) to the QImage object
    for (int ix=0;ix<rtiwidth;ix++)
        for (int iy=0;iy<rtiheight;iy++)
        {
            image.setPixel(ix,iy,qRgb(displayimage[iy*rtiwidth*bands+ix*bands+0]
                                      ,displayimage[iy*rtiwidth*bands+ix*bands+1]
                                      ,displayimage[iy*rtiwidth*bands+ix*bands+2]));
        }

    // Display the QImage object on screen
    ui->imageLabel->setPixmap(QPixmap::fromImage(image));
}
