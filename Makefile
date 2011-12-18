EXTENSION_TARGET = MpInstallmentsCalculator.oex
DIST_FILES = config.xml index.html options.js popup.html popup.js background.js \
		locales/* includes/*.js \
		assets/css/*.css assets/icons/icon_*.png assets/js/*.js \
		assets/img/*.gif assets/img/*.png assets/img/cardIssuers/*.png

all: clean dist

clean:
	rm -f $(EXTENSION_TARGET)

dist: $(EXTENSION_TARGET)

$(EXTENSION_TARGET): $(DIST_FILES)
	zip -9r $(EXTENSION_TARGET) $(DIST_FILES)
	echo -e "\n>>> DONE - $(EXTENSION_TARGET) generated\n>>> Remember to bump version and tag it if this is the next release"

version:
	grep "version=\".*\..*\..*\"" config.xml
	echo -e "\n>>> Type \"make bump version=<new_version>\" to bump it"

bump:
	find . -name config.xml -exec sed -i "s/version=\".*\..*\..*\" /version=\"$(version)\" /g" {} \;
	git add config.xml
	git commit -m "Version bumped to $(version)"
	echo -e "\n>>> New version: $(version) - Committed and tagged"
