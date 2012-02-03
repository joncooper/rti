all: import docco cptemplate ga ul

import:
	cd js; import bundle.coffee rtiviewer.js

docco:
	docco js/*coffee
	rm docs/bundle.html

template: cptemplate ga ul

cptemplate:
	cp index.html.t index.html

ga: cptemplate docco
	ruby -pi -e "sub(/--GA--/, File.read('assets/ga.html'))" index.html
	ruby -pi -e "sub(/<\/head>/, File.read('assets/ga.html'))" docs/*.html

ul: cptemplate
	cd rti; ruby make-ul.rb > files.html
	ruby -pi -e "sub(/--FILES--/, File.read('rti/files.html'))" index.html
	rm rti/files.html

clean:
	rm -f js/*js
