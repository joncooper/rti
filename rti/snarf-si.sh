#!/bin/sh
cat per_oldPersian.asp| grep 'showPTM' | grep '\.ptm' | sed "s/.*showPTM(\'//g" | sed "s/\');.*//g" | awk '{ print "http://www.asia.si.edu/research/squeezeproject/jpview/ptmfiles/" $1}' | wget -i -
