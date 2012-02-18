function printVersion() {
	// see http://www.opera.com/docs/apis/extensions/widgetobjectguide/
	document.write(widget.version);
}

function printCurrentYear() {
	document.write((new Date()).getFullYear());
}
