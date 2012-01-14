#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>

namespace Ui {
    class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

protected:
    void mousePressEvent(QMouseEvent* event);
//    void mouseMoveEvent(QMouseEvent* event);

private:
    Ui::MainWindow *ui;
    float* hshimage;
    unsigned char* displayimage;
    QImage image;
};

#endif // MAINWINDOW_H
