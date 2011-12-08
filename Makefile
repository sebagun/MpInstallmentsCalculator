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
