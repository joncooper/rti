#ifndef RTIUTIL_H
#define RTIUTIL_H

#include <iostream>
#include <fstream>
#include <math.h>

using namespace std;

// global variables

// RTI file info : These variables are initialize in the loadHSH function
// rtiwidth, rtiheight - Height and width of the loaded RTI
// bands - Number of color channels in the image, usually 3
// order - The order of the RTI reflectance model. The actual number of coefficients (i.e. terms) = order * order
int rtiwidth, rtiheight, bands, order;

// The global light position, used in the renderImageHSH() method. Normalize before calling the renderImageHSH()
float lx, ly, lz;

const double PI=3.14159265;


// Returns the index of an element in the HSHImage float array given the following arguments,
// h - y position of the current pixel
// w - x position of the current pixel
// b - the current color channel
// o - the current term (keep in mind there are order*order terms)
inline int getindex(int h, int w, int b, int o)
{
        return h * (rtiwidth*bands*order*order) + w * (bands*order*order) + b*(order*order) + o;
}


// Returns a float array containing the entire RTI coefficient set. The order of elements in the float array is,
// rtiheight*rtiwidth*bands*terms
// (where terms = (order*order), for other variables check the comments above)
float * loadHSH(char* fn)
{
   FILE *fp;
   float *hshpixels = NULL;
        float scale[30],bias[30];
        unsigned char tmpuc[30];
        char buffer[500];
        //g_mode=MODE_HEMISPHERICAL;


        ifstream infile(fn,ios::binary);

        while (infile.peek() == '#') {
                infile.getline(buffer,500);
        }

        int file_type, terms, basis_type, element_size;
        float dummy_scale, dummy_bias;
        infile >> file_type;
        infile >> rtiwidth >> rtiheight >> bands;
        infile >> terms >> basis_type >> element_size;
        infile.getline(buffer,10);

        order = sqrt((float)terms);

        hshpixels = (float*)malloc(rtiwidth*rtiheight*bands*order*order*sizeof(float));

        for (int i=0; i<terms; i++)
                infile.read((char *)&scale[i],sizeof(float)); // scale
        for (int i=0; i<terms; i++)
                infile.read((char *)&bias[i],sizeof(float)); // bias


        for (int j=0; j<rtiheight; j++)
                for (int i=0; i<rtiwidth; i++)
                        for (int b=0; b<bands; b++)
                        {
                                infile.read((char *)&tmpuc,sizeof(char)*terms);
                                for (int q=0; q<terms; q++)
                                {
                                        float value = float(tmpuc[q])/255;
                                        value = (value*scale[q])+bias[q];
                                        hshpixels[getindex(rtiheight-1-j,i,b,q)] = value;   // flip the image (rtiheight - 1 - j) for opengl pixel rendering
                                }
                        }

        infile.close();
   return hshpixels;
}

// Renders an image under the current lighting position as specified by global variables lx, ly and lz
// The HSHImage float array is passed as input, and an image with (bands) color channels is returned as the output
void renderImageHSH(float * hshimage, unsigned char* Image)
{
        double weights[30];

        // Computes the weights based on the lighting direction
        double phi = atan2(ly,lx);
        if (phi<0) phi+=2*PI;
        double theta = acos(lz);

        weights[0] = 1/sqrt(2*PI);
        weights[1]  = sqrt(6/PI)      *  (cos(phi)*sqrt(cos(theta)-cos(theta)*cos(theta)));
        weights[2]  = sqrt(3/(2*PI)) *  (-1 + 2*cos(theta));
        weights[3]  = sqrt(6/PI)      *  (sqrt(cos(theta) - cos(theta)*cos(theta))*sin(phi));

        weights[4]  = sqrt(30/PI)     *  (cos(2*phi)*(-cos(theta) + cos(theta)*cos(theta)));
        weights[5]  = sqrt(30/PI)     *  (cos(phi)*(-1 + 2*cos(theta))*sqrt(cos(theta) - cos(theta)*cos(theta)));
        weights[6]  = sqrt(5/(2*PI)) *  (1 - 6*cos(theta) + 6*cos(theta)*cos(theta));
        weights[7]  = sqrt(30/PI)     *  ((-1 + 2*cos(theta))*sqrt(cos(theta) - cos(theta)*cos(theta))*sin(phi));
        weights[8]  = sqrt(30/PI)     *  ((-cos(theta) + cos(theta)*cos(theta))*sin(2*phi));

        weights[9]   = 2*sqrt(35/PI)  * cos(3*phi)*pow(cos(theta) - cos(theta)*cos(theta),(3/2));
        weights[10]  = (sqrt(210/PI)  * cos(2*phi)*(-1 + 2*cos(theta))*(-cos(theta) + cos(theta)*cos(theta)));
        weights[11]  = 2*sqrt(21/PI)  * cos(phi)*sqrt(cos(theta) - cos(theta)*cos(theta))*(1 - 5*cos(theta) + 5*cos(theta)*cos(theta));
        weights[12]  = sqrt(7/(2*PI)) * (-1 + 12*cos(theta) - 30*cos(theta)*cos(theta) + 20*cos(theta)*cos(theta)*cos(theta));
        weights[13]  = 2*sqrt(21/PI)  * sqrt(cos(theta) - cos(theta)*cos(theta))*(1 - 5*cos(theta) + 5*cos(theta)*cos(theta))*sin(phi);
        weights[14]  = (sqrt(210/PI)  * (-1 + 2*cos(theta))*(-cos(theta) + cos(theta)*cos(theta))*sin(2*phi));
        weights[15]  = 2*sqrt(35/PI)  * pow(cos(theta) - cos(theta)*cos(theta),(3/2))*sin(3*phi);


   for(int j=0;j<rtiheight;j++)
   {
       for(int i=0;i<rtiwidth;i++)
       {
                   // The computation for a single pixel
                   for (int b=0; b<bands; b++)
                   {
                            // The computation for a single color channel on a single pixel
                            double value = 0;
                            // Multiply and sum the coefficients with the weights.
                            // This evaluates the polynomial function we use for lighting
                            for (int q=0;q<order*order;q++)
                            {
                                    value += hshimage[getindex(j,i,b,q)]*weights[q];
                            }
                            value = min(value,1.0);
                            value = max(value,0.0);
                            // Set the computed pixel color for that pixel, color channel
                            Image[j*rtiwidth*bands+i*bands+b]=(unsigned char)(value*255);

                   }
           }
   }
}
#endif // RTIUTIL_H
