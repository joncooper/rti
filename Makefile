all: import docco

import:
	cd js; import bundle.coffee rtiviewer.js

docco:
	docco js/*coffee
	rm docs/bundle.html

clean:
	rm -f js/*js
