//
// The background process
//

/*
	Puts the button in toolbar and setups the popup and the badge
*/
var theButton;
window.addEventListener("load", function() {
	var UIItemProperties = {
		disabled: false,
		title: getMsg("extension.name"),
		icon: "assets/icons/icon_18.png",
		popup: {
			href: "popup.html",
			width: 600,
			height: 490
		},
		badge: {
			textContent: '',
			backgroundColor: '#E00',
			color: '#FFF',
			display: 'block'
		}
	}
	theButton = opera.contexts.toolbar.createItem(UIItemProperties);
	opera.contexts.toolbar.addItem(theButton);

	// Enable the badge when an injected tab is detected
	//opera.extension.onconnect = toggleBadge; // I'll do it in the DOMContentLoaded event, to allow both messaging and the badge in the onconnect event.
	opera.extension.tabs.onfocus = toggleBadge;
	opera.extension.tabs.onblur = toggleBadge;
}, false);

function toggleBadge() {
	var tab = opera.extension.tabs.getFocused();
	var vipUrlRegexp = /^https?:\/\/(articulo|produto)\.mercadoli(b|v)re\.(com\.ar\/MLA|com\.br\/MLB|cl\/MLC|com\.co\/MCO|com\.mx\/MLM|com\.ve\/MLV)-[0-9]+/;
	if (tab && vipUrlRegexp.test(tab.url)) {
		// http://www.alanwood.net/unicode/miscellaneous_symbols.html
		theButton.badge.textContent = ' \u2605 '; // A nice star
	}
	else {
		theButton.badge.textContent = '';
	}
}

/*
	Messaging setup to allow communication between the popup and the injected script.

	Shamelessly copied from:
	http://dev.opera.com/articles/view/opera-extensions-messaging/#popup_injectedscript
*/
window.addEventListener("DOMContentLoaded", function() {
	opera.extension.onconnect = function(event) {
		toggleBadge(); // Puts the bagde
		if (event.origin.indexOf("popup.html") > -1 && event.origin.indexOf('widget://') > -1) {
			var tab = opera.extension.tabs.getFocused();
			if (tab) {
				tab.postMessage("Send a port", [event.source]);
				opera.postError('sent a message to injected script');
			}
		}
	}
}, false);
