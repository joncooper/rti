all: import docco ga

import:
	cd js; import bundle.coffee rtiviewer.js

docco:
	docco js/*coffee
	rm docs/bundle.html

ga:
	ruby -pi -e "sub(/<\/head>/, File.read('assets/ga.html'))" docs/*.html

clean:
	rm -f js/*js
