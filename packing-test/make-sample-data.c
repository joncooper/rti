#include <stdio.h>

int
main()
{
  FILE *fd;
  int emit_count = 4;
  float emit[] = {
    1.0, 0.5, 0.25, 0.125f
  };

  fd = fopen("sample.dat", "w");
  fwrite(&emit, emit_count, sizeof(float), fd);
  fclose(fd);
}
