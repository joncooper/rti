all: import docco

import:
	cd js; import bundle.coffee rtiviewer.js

docco:
	docco js/*coffee

clean:
	rm -f js/*js
