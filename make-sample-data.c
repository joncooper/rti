#include <stdio.h>

int
main()
{
  FILE *fd;
  int emit_count = 4;
  float emit[] = {
    1.0f, 0.01f, 0.01f, 0.001f
  };

  fd = fopen("sample.dat", "w");
  fwrite(&emit, emit_count, sizeof(float), fd);
  fclose(fd);
}
