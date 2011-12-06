// ==UserScript==
// @include http://articulo.mercadolibre.com.ar/MLA-*
// @include https://articulo.mercadolibre.com.ar/MLA-*
// @include http://produto.mercadolivre.com.br/MLB-*
// @include https://produto.mercadolivre.com.br/MLB-*
// @include http://articulo.mercadolibre.cl/MLC-*
// @include https://articulo.mercadolibre.cl/MLC-*
// @include http://articulo.mercadolibre.com.co/MCO-*
// @include https://articulo.mercadolibre.com.co/MCO-*
// @include http://articulo.mercadolibre.com.mx/MLM-*
// @include https://articulo.mercadolibre.com.mx/MLM-*
// @include http://articulo.mercadolibre.com.ve/MLV-*
// @include https://articulo.mercadolibre.com.ve/MLV-*
// ==/UserScript==

//
// Injected script for automatically filling the amount of the item being seen
//

var background;
var popupPort;

opera.extension.onmessage = function(event) {
	if (event.data == "Send a port") {
		// in case you need to send anything to background, just do background.postMessage()
		background = event.source;
		var channel = new MessageChannel();
		
		popupPort = channel.port1;
		event.ports[0].postMessage("Here is a port to the currently focused tab", [channel.port2]);
		opera.postError('post sent from injected script');
		
		channel.port1.onmessage = handlePopupMessage;
	}
}

function handlePopupMessage(event) {
	opera.postError("Message received from the popup: " + event.data);
	
	if (event.data == "request_vip_get_url") {
		popupPort.postMessage("response_vip_get_url:" + document.URL);
	}
}
