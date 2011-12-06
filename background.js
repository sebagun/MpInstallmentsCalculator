//
// The background process
//

/*
	Messaging setup to allow communication between the popup and the injected script.

	Shamelessly copied from:
	http://dev.opera.com/articles/view/opera-extensions-messaging/#popup_injectedscript
*/

window.addEventListener("DOMContentLoaded", function() {
	opera.extension.onconnect = function(event) {
		if (event.origin.indexOf("popup.html") > -1 && event.origin.indexOf('widget://') > -1) {
			var tab = opera.extension.tabs.getFocused();
			if (tab) {
				tab.postMessage("Send a port", [event.source]);
				opera.postError('sent a message to injected script');
			}
		}
	}
}, false);
