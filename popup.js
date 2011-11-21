var marketplaces = [
	{id:"NONE", name:"MercadoPago", logo:"logo-mercadopago.png"},
	{id:"MELI", name:"MercadoLibre", logo:"logo-mercadolibre.png"}
];
var sites = [
	{id:"MLA", name:"Argentina", flag:"flag-ar.png", currencySymbol: "$"},
	{id:"MLB", name:"Brasil", flag:"flag-br.png", currencySymbol: "R$"},
	{id:"MLC", name:"Chile", flag:"flag-cl.png", currencySymbol: "$"},
	{id:"MCO", name:"Colombia", flag:"flag-co.png", currencySymbol: "$"},
	{id:"MLM", name:"México", flag:"flag-mx.png", currencySymbol: "$"},
	{id:"MLV", name:"Venezuela", flag:"flag-ve.png", currencySymbol: "BsF"}
];
var badges = [
	{id:"promotion", description:"Promoción sin interés", file:"badge-promotion.png"}
];

var payerCosts = [];
var exceptionsByCardIssuer = [];
var amount = 0.0;

$(document).ready(function() {
	// Oculto cosas
	$(".spinner-medium, .spinner-small").hide();
	
	// Cargo los marketplaces
	$.each(marketplaces, function(index, value) {
		$("#marketplaces").append("<label><input type=\"radio\" name=\"marketplace\" value=\"" + value.id + "\" " + (widget.preferences.marketplaceId == value.id ? "checked" : "") + " /><img src=\"/assets/img/" + value.logo + "\" alt=\"" + value.name + "\" title=\"" + value.name + "\" /></label>");
	});
	// Cargo los sites
	$.each(sites, function(index, value) {
		$("#sites").append("<label><input type=\"radio\" name=\"site\" value=\"" + value.id + "\" " + (widget.preferences.siteId == value.id ? "checked" : "") + " /><img src=\"/assets/img/" + value.flag + "\" alt=\"" + value.name + "\" title=\"" + value.name + "\" /></label>");
	});
	
	// Que se dispare la búsqueda de tarjetas disponibles ante la selección de un site/marketplace
	$("#sites input, #marketplaces input").change(function() {
		getCardsInfo();
		changeCurrencySymbol();
		// Actualizo las preferencias
		widget.preferences.marketplaceId = selectedMarketplace();
		widget.preferences.siteId = selectedSite();
	});
	
	// Cargo el símbolo del currency del site por defecto
	changeCurrencySymbol();
	
	// Validar el monto a pagar ante cada cambio, y actualizar montos de cuotas
	$("#amount").keyup(function() {
		updateAmounts();
	});
	
	$("#clearAmount").click(function() {
		clearAmount();
	});
	
	// Busco las TCs del site/marketplace seleccionados por defecto
	getCardsInfo();
});

function error() {
	$(".spinner-medium, .spinner-small").hide();
	alert("Ups... hubo un error. Por favor informámelo a sebastiangun@gmail.com con los pasos a seguir para reproducirlo. Gracias!");
}

function selectedMarketplace() {
	return $('#marketplaces input:checked').val();
}

function selectedSite() {
	return $('#sites input:checked').val();
}

function selectedCard() {
	return $('#cards input:checked').val();
}

function selectedCardIssuer() {
	return $('#cardIssuers input:checked').val();
}

function getCardsInfo() {
	$('#cards label, #pricings table, #cardIssuers label').hide("fast").remove();
	$("#cards .spinner-medium").show("fast");
	$.jsonp({
		url: "https://api.mercadolibre.com/sites/" + selectedSite() + "/payment_methods?marketplace=" + selectedMarketplace() + "&callback=?",
		timeout: 30000,
		success: function(data, status) {
			$("#cards .spinner-medium").hide("fast");
			$.each(data[2], function(index, value) {
				if ("credit_card" == value.payment_type_id) {
					$("#cards").append("<label><input type=\"radio\" name=\"card\" value=\"" + value.id + "\" id=\"" + value.id + "\" /><img src=\"" + value.thumbnail + "\" alt=\"" + value.name + "\" title=\"" + value.name + "\" /></label>");
				}
			});
			// Que se dispare la búsqueda de los datos de una tarjeta ante la selección de la misma
			$("#cards input").change(function() {
				getCardInfo();
			});
		},
		error: function(XHR, textStatus, errorThrown){
			error();
		}
	});
}

function getCardInfo() {
	$('#pricings table, #cardIssuers label').hide("fast").remove();
	$("#pricings .spinner-medium, #cardIssuers .spinner-medium").show("fast");
	$.jsonp({
		url: "https://api.mercadolibre.com/sites/" + selectedSite() + "/payment_methods/" + selectedCard() + "?marketplace=" + selectedMarketplace() + "&callback=?",
		timeout: 30000,
		success: function(data, status) {
			$("#pricings .spinner-medium, #cardIssuers .spinner-medium").hide("fast");
			payerCosts = data[2].payer_costs;
			exceptionsByCardIssuer = [];
			try {
				updatePricingsTable();
			}
			catch (error) {
				// Hay un extraño bug cuando se ingresa el monto y luego se selecciona la TC
				// ni bien se abre la extesión. No se porque se dá, pero así se soluciona.
				setTimeout("getCardInfo()", 50);
				return;
			}
			if (data[2].exceptions_by_card_issuer && data[2].exceptions_by_card_issuer.length > 0) {
				$.each(data[2].exceptions_by_card_issuer, function(index, value) {
					$("#cardIssuers").append("<label><input type=\"radio\" name=\"cardIssuer\" value=\"" + value.card_issuer.id + "\" id=\"" + value.card_issuer.id + "\" />" + value.card_issuer.name + "</label>");
					exceptionsByCardIssuer[""+value.card_issuer.id] = value.payer_costs;
				});
				// Que se muestren los pricings del emisor en promo ante la selección del mismo
				$("#cardIssuers input").change(function() {
					updatePricingsTable();
				});
			}
			else {
				$("#cardIssuers").append("<label>Actualmente no hay bancos con<br />promociones para esta tarjeta</label>");
			}
		},
		error: function(XHR, textStatus, errorThrown){
			error();
		}
	});
}

function makeBadge(badgeId) {
	var badge = $.grep(badges, function(value, index) {
		return value.id == badgeId;
	})[0];
	return "<img src=\"/assets/img/" + badge.file + "\" alt=\"" + badge.description + "\" title=\"" + badge.description + "\" />";
}

function round(value) {
	// Redondea a 2 decimales
	return Math.round(value * 100) / 100;
}

function makePricingsTable(pricings) {
	var table = new Array("<table border=\"1\" cellspacing=\"0\"><tr><th>Cuotas</th><th>Interés</th>");
	if (amount > 0) {
		table.push("<th>Monto<br />total</th><th>Monto<br />por cuota</th>");
	}
	table.push("<th>Extras</th></tr>");
	$.each(pricings, function(index, value) {
		table.push("<tr><td>");
		table.push(value.installments);
		table.push("</td><td>");
		table.push(value.installment_rate + " %");
		table.push("</td><td>");
		if (amount > 0) {
			var totalAmount = amount + (amount * value.installment_rate / 100);
			table.push(getCurrencySymbol() + " " + round(totalAmount));
			table.push("</td><td>");
			table.push(getCurrencySymbol() + " " + round(totalAmount / value.installments));
			table.push("</td><td>");
		}
		table.push((value.installment_rate == 0 && value.installments > 1) ? makeBadge("promotion") : "");
		table.push("</td></tr>");
	});
	if (selectedCardIssuer()) {
		table.push("<tr><td colspan=\"" + (amount > 0 ? 5 : 3) + "\" class=\"white-background\">");
		table.push("<a href=\"javascript:restorePayerCosts();\">Restablecer pricings originales de la tarjeta</a>");
		table.push("</td></tr>");
	}
	table.push("</table>");
	return table.join("");
}

function restorePayerCosts() {
	$('#cardIssuers input').val([]); // destildo el cardIssuer seleccionado
	updatePricingsTable();
}

function getCurrencySymbol() {
	return $.grep(sites, function(value, index) {
		return value.id == selectedSite();
	})[0].currencySymbol;
}

function changeCurrencySymbol() {
	$('#currency').text(getCurrencySymbol());
}

function updateAmounts() {
	// Primero corrijo el monto a pagar si no tiene el formato esperado
	if (!$('#amount').val().match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
		// Reemplazo coma por punto y luego quito cualquier caracter que no sea número o punto
		var corrected = $('#amount').val().replace(",",".").replace(/[^0-9\.]/g,"");
		// Si hay más de un punto, recorto hasta la posición del segundo
		if (corrected.split(".").length > 2) {
			var segments = corrected.split(".");
			corrected = segments[0] + "." + segments[1];
		}
		// Si hay más de dos decimales, saco los que sobran
		if (corrected.indexOf(".") > -1 && corrected.substring(corrected.indexOf(".")).length > 2) {
			corrected = corrected.substring(0, corrected.indexOf(".") + 3);
		}
		$('#amount').val(corrected);
	}
	
	// Actualizo el monto
	amount = parseFloat($('#amount').val());
	if (isNaN(amount)) {
		amount = 0.0;
	}
	
	// Actualizo los pricings
	updatePricingsTable();
}

function clearAmount() {
	$('#amount').val([]);
	amount = 0.0;
	updatePricingsTable();
}

function updatePricingsTable() {
	if (selectedCardIssuer()) {
		$('#pricings table').remove();
		$("#pricings").append(makePricingsTable(exceptionsByCardIssuer[selectedCardIssuer()]));	
	}
	else if (selectedCard()) {
		$('#pricings table').remove();
		$("#pricings").append(makePricingsTable(payerCosts));	
	}
}
