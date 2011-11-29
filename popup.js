var marketplaces = [
	{id:"NONE", name:"MercadoPago", logo:"logo-mercadopago.png"},
	{id:"MELI", name:"MercadoLibre", logo:"logo-mercadolibre.png"}
];
var sites = [
	{id:"MLA", name:"sites.MLA.name", flag:"flag-ar.png", currencySymbol: "$"},
	{id:"MLB", name:"sites.MLB.name", flag:"flag-br.png", currencySymbol: "R$"},
	{id:"MLC", name:"sites.MLC.name", flag:"flag-cl.png", currencySymbol: "$"},
	{id:"MCO", name:"sites.MCO.name", flag:"flag-co.png", currencySymbol: "$"},
	{id:"MLM", name:"sites.MLM.name", flag:"flag-mx.png", currencySymbol: "$"},
	{id:"MLV", name:"sites.MLV.name", flag:"flag-ve.png", currencySymbol: "BsF"}
];
var badges = [
	{id:"promotion", description:"badges.promotion.description", file:"badge-promotion.png"}
];

var payerCosts = [];
var exceptionsByCardIssuer = [];
var amount = 0.0;
var collectorId = null;

// MercadoLibre's API endpoints
const mlapiBaseUrl = "https://api.mercadolibre.com/";
var mlapiUrls = new Array();
mlapiUrls["users.by.nickname"] = mlapiBaseUrl + "users/search?nickname=##USER_DATA##&callback=?";
mlapiUrls["users.by.email"] = mlapiBaseUrl + "users/search?email=##USER_DATA##&callback=?";
mlapiUrls["users.by.id"] = mlapiBaseUrl + "users/##USER_DATA##?callback=?";
mlapiUrls["paymentMethods.list"] = mlapiBaseUrl + "sites/##SITE##/payment_methods?marketplace=##MARKETPLACE##&callback=?";
mlapiUrls["paymentMethods.single"] = mlapiBaseUrl + "sites/##SITE##/payment_methods/##PAYMENT_METHOD##?marketplace=##MARKETPLACE##&callback=?";
mlapiUrls["acceptedPaymentMethods.list"] = mlapiBaseUrl + "users/##USER_ID##/accepted_payment_methods?marketplace=##MARKETPLACE##&callback=?";
mlapiUrls["acceptedPaymentMethods.single"] = mlapiBaseUrl + "users/##USER_ID##/accepted_payment_methods/##PAYMENT_METHOD##?marketplace=##MARKETPLACE##&callback=?";

function fillLocalizedUI() {
	$("#marketplaces legend").text(getMsg("marketplaces.legend"));
	$("#sites legend").text(getMsg("sites.legend"));
	$("#additionalData legend").text(getMsg("additionalData.legend"));
	$("#cards legend").text(getMsg("cards.legend"));
	$("#pricings legend").text(getMsg("pricings.legend"));
	$("#cardIssuers legend").text(getMsg("cardIssuers.legend"));
	
	$("#amountToPay").text(getMsg("amountToPay.label"));
	$("#clearAmount").attr({alt: getMsg("amountToPay.clear.alt"), title: getMsg("amountToPay.clear.title")});
	$("#helpAmount").attr({alt: getMsg("amountToPay.help.alt"), title: getMsg("amountToPay.help.title")});
	
	$("#collectorUser").text(getMsg("collectorUser.label"));
	$("#clearCollector").attr({alt: getMsg("collectorUser.clear.alt"), title: getMsg("collectorUser.clear.title")});
	$("#helpCollector").attr({alt: getMsg("collectorUser.help.alt"), title: getMsg("collectorUser.help.title")});
	$("#submitCollector").attr({alt: getMsg("collectorUser.submit.alt"), title: getMsg("collectorUser.submit.title")});
	$("#okCollector").attr({alt: getMsg("collectorUser.ok.alt"), title: getMsg("collectorUser.ok.title")});
	$("#errorCollector").attr({alt: getMsg("collectorUser.error.alt"), title: getMsg("collectorUser.error.title")});
	$("#collectorDataTypeNickname").text(getMsg("collectorUser.dataType.nickname"));
	$("#collectorDataTypeEmail").text(getMsg("collectorUser.dataType.email"));
	$("#collectorDataTypeId").text(getMsg("collectorUser.dataType.id"));
}

$(document).ready(function() {
	// Load localized messages
	fillLocalizedUI();
	
	// Hide stuff
	$(".spinner-medium, .spinner-small, #okCollector, #errorCollector").hide();
	
	// Load marketplaces
	$.each(marketplaces, function(index, value) {
		$("#marketplaces").append("<label><input type=\"radio\" name=\"marketplace\" value=\"" + value.id + "\" " + (widget.preferences.marketplaceId == value.id ? "checked" : "") + " /><img src=\"/assets/img/" + value.logo + "\" alt=\"" + value.name + "\" title=\"" + value.name + "\" /></label>");
	});
	
	// Load sites
	$.each(sites, function(index, value) {
		$("#sites").append("<label><input type=\"radio\" name=\"site\" value=\"" + value.id + "\" " + (widget.preferences.siteId == value.id ? "checked" : "") + " /><img src=\"/assets/img/" + value.flag + "\" alt=\"" + getMsg(value.name) + "\" title=\"" + getMsg(value.name) + "\" /></label>");
	});
	
	// Trigger the search for available cards when user selects a site/marketplace
	$("#sites input, #marketplaces input").change(function() {
		getCardsInfo();
		changeCurrencySymbol();
		// Update the preferences
		widget.preferences.marketplaceId = selectedMarketplace();
		widget.preferences.siteId = selectedSite();
	});
	
	// Load the currency symbol for default site
	changeCurrencySymbol();
	
	// Validate the amount to pay after every change, and update per installments amounts
	$("#amount").keyup(function() {
		updateAmounts();
	});
	
	$("#clearAmount").click(function() {
		clearAmount();
	});
	
	// Validate the collector after the user clicks on the submit icon, or when the user hits enter on the field
	$("#collector").keyup(function(e) {
		if (e.keyCode == 13) {
			updateCollector();
		}
	});
	$("#submitCollector").click(function() {
		updateCollector();
	});
	
	$("#clearCollector").click(function() {
		clearCollector();
	});
	
	// Search for credit cards of default site/marketplace
	getCardsInfo();
});

function error(errorMsg) {
	$(".spinner-medium, .spinner-small").hide();
	alert(getMsg(errorMsg));
}

function selectedMarketplace() {
	return $('#marketplaces input:checked').val();
}

function selectedSite() {
	return $('#sites input:checked').val();
}

function selectedCollectorDataType() {
	return $('#collectorAdditionalData input[type=radio]:checked').val();
}

function selectedCard() {
	return $('#cards input:checked').val();
}

function selectedCardIssuer() {
	return $('#cardIssuers input:checked').val();
}

function getCardsInfoUrl() {
	return (collectorId == null) ? 
		mlapiUrls["paymentMethods.list"].replace("##SITE##", selectedSite()).replace(
			"##MARKETPLACE##", selectedMarketplace()) :
		mlapiUrls["acceptedPaymentMethods.list"].replace("##USER_ID##", ""+collectorId).replace(
			"##MARKETPLACE##", selectedMarketplace());
}

function getCardsInfo() {
	$('#cards label, #pricings table, #cardIssuers label').hide("fast").remove();
	$("#cards .spinner-medium").show("fast");
	$.jsonp({
		url: getCardsInfoUrl(),
		timeout: 30000,
		success: function(data, status) {
			$("#cards .spinner-medium").hide("fast");
			$.each(data[2], function(index, value) {
				if ("credit_card" == value.payment_type_id) {
					$("#cards").append("<label><input type=\"radio\" name=\"card\" value=\"" + value.id + "\" id=\"" + value.id + "\" /><img src=\"" + value.thumbnail + "\" alt=\"" + value.name + "\" title=\"" + value.name + "\" /></label>");
				}
			});
			// Trigger the search for card data when user selects it
			$("#cards input").change(function() {
				getCardInfo();
			});
		},
		error: function(XHR, textStatus, errorThrown){
			error("error.mlapi");
		}
	});
}

function getCardInfoUrl() {
	return (collectorId == null) ? 
		mlapiUrls["paymentMethods.single"].replace("##SITE##", selectedSite()).replace(
			"##PAYMENT_METHOD##", selectedCard()).replace(
				"##MARKETPLACE##", selectedMarketplace()) :
		mlapiUrls["acceptedPaymentMethods.single"].replace("##USER_ID##", ""+collectorId).replace(
			"##PAYMENT_METHOD##", selectedCard()).replace(
				"##MARKETPLACE##", selectedMarketplace());
}

function getCardInfo() {
	$('#pricings table, #cardIssuers label').hide("fast").remove();
	$("#pricings .spinner-medium, #cardIssuers .spinner-medium").show("fast");
	$.jsonp({
		url: getCardInfoUrl(),
		timeout: 30000,
		success: function(data, status) {
			$("#pricings .spinner-medium, #cardIssuers .spinner-medium").hide("fast");
			payerCosts = data[2].payer_costs;
			exceptionsByCardIssuer = [];
			try {
				updatePricingsTable();
			}
			catch (error) {
				// There is a weird bug when the user fills in the amount and then selects the card,
				// right after he opens the extension. I don't know why it happens, but this fixes it.
				setTimeout("getCardInfo()", 50);
				return;
			}
			if (data[2].exceptions_by_card_issuer && data[2].exceptions_by_card_issuer.length > 0) {
				$.each(data[2].exceptions_by_card_issuer, function(index, value) {
					$("#cardIssuers").append("<label><input type=\"radio\" name=\"cardIssuer\" value=\"" + value.card_issuer.id + "\" id=\"" + value.card_issuer.id + "\" />" + value.card_issuer.name + "</label>");
					exceptionsByCardIssuer[""+value.card_issuer.id] = value.payer_costs;
				});
				// Trigger the display of the card issuer's promotional pricings when the user selects it
				$("#cardIssuers input").change(function() {
					updatePricingsTable();
				});
			}
			else {
				$("#cardIssuers").append("<label>" + getMsg("cardIssuers.none") + "</label>");
			}
		},
		error: function(XHR, textStatus, errorThrown){
			error("error.mlapi");
		}
	});
}

function makeBadge(badgeId) {
	var badge = $.grep(badges, function(value, index) {
		return value.id == badgeId;
	})[0];
	return "<img src=\"/assets/img/" + badge.file + "\" alt=\"" + getMsg(badge.description) + "\" title=\"" + getMsg(badge.description) + "\" />";
}

function round(value) {
	// Round to 2 decimals
	return Math.round(value * 100) / 100;
}

function makePricingsTable(pricings) {
	var table = new Array("<table border=\"1\" cellspacing=\"0\"><tr><th>");
	table.push(getMsg("pricings.table.installments"));
	table.push("</th><th>");
	table.push(getMsg("pricings.table.installmentRate"));
	table.push("</th>");
	if (amount > 0) {
		table.push("<th>");
		table.push(getMsg("pricings.table.totalAmount"));
		table.push("</th><th>");
		table.push(getMsg("pricings.table.installmentAmount"));
		table.push("</th>");
	}
	table.push("<th>");
	table.push(getMsg("pricings.table.extras"));
	table.push("</th></tr>");
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
		table.push("<a href=\"javascript:restorePayerCosts();\">");
		table.push(getMsg("pricings.table.restore"));
		table.push("</a>");
		table.push("</td></tr>");
	}
	table.push("</table>");
	return table.join("");
}

function restorePayerCosts() {
	$('#cardIssuers input').val([]); // Unselect the selected cardIssuer
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
	// First, I'll fix the amount to pay if it doesn't have the expected format
	if (!$('#amount').val().match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
		// Replace comma with dot and the remove any character that aren't numbers or dot
		var corrected = $('#amount').val().replace(",",".").replace(/[^0-9\.]/g,"");
		// If there is more than a dot, cut until the position of the second one
		if (corrected.split(".").length > 2) {
			var segments = corrected.split(".");
			corrected = segments[0] + "." + segments[1];
		}
		// If there are more than two decimals, remove the leftovers
		if (corrected.indexOf(".") > -1 && corrected.substring(corrected.indexOf(".")).length > 2) {
			corrected = corrected.substring(0, corrected.indexOf(".") + 3);
		}
		$('#amount').val(corrected);
	}
	
	// Update the amount
	amount = parseFloat($('#amount').val());
	if (isNaN(amount)) {
		amount = 0.0;
	}
	
	// Update the pricings
	updatePricingsTable();
}

function clearAmount() {
	if ($('#amount').val() != "") {
		$('#amount').val([]);
		amount = 0.0;
		updatePricingsTable();
	}
}

function updateCollector() {
	if ($('#collector').val() == "") {
		return;
	}
	
	$("#okCollector, #errorCollector").hide("fast");
	$("#spinnerCollector").show("fast");
	
	// Fix the input
	switch (selectedCollectorDataType()) {
		case "nickname":
			$('#collector').val($('#collector').val().toUpperCase());
			break;
		case "email":
			$('#collector').val($('#collector').val().toLowerCase());
			break;
		case "id":
			// Nothing to fix
			break;
	}
	
	// Check minimal integrity
	switch (selectedCollectorDataType()) {
		case "nickname":
			// Nothing to validate
			break;
		case "email":
			if (!$('#collector').val().match(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]+$/)) {
				errorCollector("collectorUser.invalid.email");
				return;
			}
			break;
		case "id":
			if (isNaN(parseInt($('#collector').val(), 10))) {
				errorCollector("collectorUser.invalid.id");
				return;
			}
			break;
	}
	
	// Format OK, ready to go...
	getUserInfo();
}

function errorCollector(msg) {
	$("#spinnerCollector").hide("fast");
	$("#errorCollector").attr({alt: getMsg(msg), title: getMsg(msg)}).show("fast");
	collectorId = null;
}

function clearCollector() {
	if ($('#collector').val() != "") {
		$("#okCollector, #errorCollector, #spinnerCollector").hide("fast");
		$('#collector').val([]);
		collectorId = null;
		getCardsInfo();
	}
}

function getUserInfo() {
	$.jsonp({
		url: mlapiUrls["users.by." + selectedCollectorDataType()].replace("##USER_DATA##", $('#collector').val()),
		timeout: 30000,
		success: function(data, status) {
			$("#spinnerCollector").hide("fast");
			if (data[0] == 200) {
				$("#okCollector").show("fast");
				collectorId = data[2].id;
				if (selectedCard()) {
					getCardInfo();
				}
				else {
					getCardsInfo();
				}
			}
			else {
				errorCollector("collectorUser.notFound." + selectedCollectorDataType());
			}
		},
		error: function(XHR, textStatus, errorThrown){
			error("error.mlapi");
		}
	});
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
