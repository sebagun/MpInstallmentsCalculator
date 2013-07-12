var marketplaces = [
	{id:"NONE", name:"MercadoPago", logo:"logo-mercadopago.png"},
	{id:"MELI", name:"MercadoLibre", logo:"logo-mercadolibre.png"},
	{id:"MAOP", name:"MasOportunidades", logo:"logo-masoportunidades.gif"}
];
var sites = [
	{id:"MLA", name:"sites.MLA.name", flag:"flag-ar.png", currencySymbol: "$", currencyId: "ARS"},
	{id:"MLB", name:"sites.MLB.name", flag:"flag-br.png", currencySymbol: "R$", currencyId: "BRL"},
	{id:"MLC", name:"sites.MLC.name", flag:"flag-cl.png", currencySymbol: "$", currencyId: "CLP"},
	{id:"MCO", name:"sites.MCO.name", flag:"flag-co.png", currencySymbol: "$", currencyId: "COP"},
	{id:"MLM", name:"sites.MLM.name", flag:"flag-mx.png", currencySymbol: "$", currencyId: "MXN"},
	{id:"MLV", name:"sites.MLV.name", flag:"flag-ve.png", currencySymbol: "BsF", currencyId: "VEF"}
];
var badges = [
	{id:"promotion", description:"badges.promotion.description", file:"badge-promotion.png"},
	{id:"promotionDates", description:"badges.promotionDates.description", file:"badge-promotion_dates.png"},
	{id:"interestDeduction", description:"badges.interestDeduction.description", file:"badge-interest_deduction.png"}
];

var payerCosts = [];
var issuersPayerCosts = [];
var defaultCardIssuerId = null;
var labels = [];
var exceptionsByCardIssuer = [];
var amount = 0.0;
var collectorId = null;
var onChangeSiteOrMarketplaceFunction = null;

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
mlapiUrls["issuerPayerCosts"] = mlapiBaseUrl + "sites/##SITE##/card_issuers/##ISSUER_ID##/payment_methods/##PAYMENT_METHOD##/payer_costs?callback=?";
mlapiUrls["items"] = mlapiBaseUrl + "items/##ITEM_ID##?callback=?";
mlapiUrls["currencyConversions"] = mlapiBaseUrl + "currency_conversions/search?from=##FROM##&to=##TO##";

function fillLocalizedUI() {
	$("h1").text(getMsg("extension.name"));
	
	$("#marketplaces legend").text(getMsg("marketplaces.legend"));
	$("#sites legend").text(getMsg("sites.legend"));
	$("#additionalData legend").text(getMsg("additionalData.legend"));
	$("#cards legend").text(getMsg("cards.legend"));
	$("#pricings legend").text(getMsg("pricings.legend"));
	$("#cardIssuers legend").text(getMsg("cardIssuers.legend"));
	
	$("#amountToPay").text(getMsg("amountToPay.label"));
	$("#convertedAmount").attr({alt: getMsg("amountToPay.converted.alt"), title: getMsg("amountToPay.converted.alt")});
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
	// If the user is in a VIP, tries to get the url to auto-fill the item price
	sendMessageToInjectedScript("request_vip_get_url");
	
	// Load localized messages
	fillLocalizedUI();
	
	// Hide stuff
	$(".spinner-medium, .spinner-small, #okCollector, #errorCollector, #convertedAmount").hide();
	
	// Load marketplaces
	$.each(marketplaces, function(index, value) {
		$("#marketplaces").append("<label><input type=\"radio\" name=\"marketplace\" value=\"" + value.id + "\" " + (widget.preferences.marketplaceId == value.id ? "checked" : "") + " /><img src=\"/assets/img/" + value.logo + "\" alt=\"" + value.name + "\" title=\"" + value.name + "\" /></label>");
	});
	
	// Load sites
	$.each(sites, function(index, value) {
		$("#sites").append("<label><input type=\"radio\" name=\"site\" value=\"" + value.id + "\" " + (widget.preferences.siteId == value.id ? "checked" : "") + " /><img src=\"/assets/img/" + value.flag + "\" alt=\"" + getMsg(value.name) + "\" title=\"" + getMsg(value.name) + "\" /></label>");
	});
	
	// Trigger the search for available cards when user selects a site/marketplace
	onChangeSiteOrMarketplaceFunction = function() {
		clearCollectorInternal();
		getCardsInfo();
		changeCurrencySymbol();
		// Update the preferences
		widget.preferences.marketplaceId = selectedMarketplace();
		widget.preferences.siteId = selectedSite();
	};
	$("#sites input, #marketplaces input").change(onChangeSiteOrMarketplaceFunction);
	
	// Load the currency symbol for default site
	changeCurrencySymbol();
	
	// Validate the amount to pay after every change, and update per installments amounts
	$("#amount").keyup(function() {
		$("#convertedAmount").hide("fast");
		updateAmounts();
	});
	
	$("#clearAmount").click(function() {
		$("#convertedAmount").hide("fast");
		clearAmount();
	});
	
	// Validate the collector after the user clicks on the submit icon, or when the user hits enter on the field
	$("#collector").keyup(function(e) {
		if (e.keyCode == 13) { // enter key
			updateCollector();
		}
		else if ((e.keyCode == 8 || e.keyCode == 46) && $('#collector').val() == "") { // backspace or delete keys
			// If the user just cleared the field through the keyboard, force a clean clear
			clearCollector(true);
		}
	});
	$("#submitCollector").click(function() {
		updateCollector();
	});
	
	$("#clearCollector").click(function() {
		clearCollector(false);
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

function selectedCardIssuerName() {
	return $('#cardIssuers input:checked').parent().text();
}

function selectedBankOrCardIssuer() {
	// If there is a bank selected, return that issuer. Otherwise, return the default credit card issuer for the selected brand.
	return (selectedCardIssuer()) ? selectedCardIssuer() : defaultCardIssuerId;
}

function getCardsInfoUrl() {
	return (collectorId == null) ? 
		mlapiUrls["paymentMethods.list"].replace("##SITE##", selectedSite()).replace(
			"##MARKETPLACE##", selectedMarketplace()) :
		mlapiUrls["acceptedPaymentMethods.list"].replace("##USER_ID##", ""+collectorId).replace(
			"##MARKETPLACE##", selectedMarketplace());
}

function getCardsInfo() {
	defaultCardIssuerId = null;
	$('#cards label, #pricings table, #cardIssuers label').hide("fast").remove();
	$("#cards .spinner-medium").show("fast");
	$.jsonp({
		url: getCardsInfoUrl(),
		timeout: 30000,
		pageCache: true,
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

function getIssuerPayerCostsUrl(issuerId, pmId) {
	return mlapiUrls["issuerPayerCosts"].replace("##SITE##", selectedSite()).replace(
		"##ISSUER_ID##", ""+issuerId).replace("##PAYMENT_METHOD##", pmId);
}

function getIssuerPayerCosts(issuerId, pmId) {
	$.jsonp({
		url: getIssuerPayerCostsUrl(issuerId, pmId),
		timeout: 30000,
		pageCache: true,
		success: function(data, status) {
			issuersPayerCosts[""+issuerId+"-"+pmId] = data[2];
			opera.postError("payerCosts "+issuerId+"-"+pmId+": " + JSON.stringify(issuersPayerCosts[""+issuerId+"-"+pmId]));
		},
		error: function(XHR, textStatus, errorThrown){
			// Doesn't matter... it won't show the dates involving the promotions
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
		pageCache: true,
		success: function(data, status) {
			$("#pricings .spinner-medium, #cardIssuers .spinner-medium").hide("fast");
			payerCosts = data[2].payer_costs;
			labels = data[2].labels;
			exceptionsByCardIssuer = [];
			getIssuerPayerCosts(data[2].card_issuer.id, selectedCard());
			defaultCardIssuerId = data[2].card_issuer.id;
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
				var issuerIds = new Array();
				$.each(data[2].exceptions_by_card_issuer, function(index, value) {
					$("#cardIssuers").append("<label><input type=\"radio\" name=\"cardIssuer\" value=\"" + value.card_issuer.id + "\" id=\"" + value.card_issuer.id + "\" />" + value.card_issuer.name + "</label>");
					exceptionsByCardIssuer[""+value.card_issuer.id] = value;
					issuerIds.push(value.card_issuer.id);
				});
				// Sort the list alphabetically
				$("#cardIssuers label").tsort();
				// Trigger the display of the card issuer's promotional pricings when the user selects it
				$("#cardIssuers input").change(function() {
					updatePricingsTable();
				});
				// Prefetch all promotions payer costs and valid dates in the background
				$(issuerIds).each(function() {
					getIssuerPayerCosts(this, selectedCard());
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

function makeBadge(badgeId, replacements) {
	var badge = $.grep(badges, function(value, index) {
		return value.id == badgeId;
	})[0];
	return "<img src=\"/assets/img/" + badge.file + "\" alt=\"" + getMsg(badge.description, replacements) + "\" title=\"" + getMsg(badge.description, replacements) + "\" class=\"badge\" />";
}

function round(value) {
	// Round to 2 decimals
	return Math.round(value * 100) / 100;
}

function makePricingsTable(pricings, totalFinancialCost) {
	var table = new Array("<table border=\"1\" cellspacing=\"0\"><tr><th>");
	// Headers
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
	// Pricing rows
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
		// Badges (extras)
		if (value.installment_rate == 0 && value.installments > 1) {
			table.push(makeBadge("promotion"));
			if (labels && labels.indexOf("interest_deduction_by_collector") > -1) {
				table.push(makeBadge("interestDeduction"));
			}
			else {
				var issuerPayerCosts = issuersPayerCosts[""+selectedBankOrCardIssuer()+"-"+selectedCard()];
				if (!issuerPayerCosts) {
					// Go to sleep for a little while, maybe we are fetching this info in the background... Then repaint the table.
					opera.postError("Sleeping for promotion dates...");
					setTimeout("updatePricingsTable()", 1000);
				}
				if (issuerPayerCosts) {
					opera.postError("Showing dates between promo for " + selectedBankOrCardIssuer() + "-" + selectedCard() + " " + value.installments + " installments");
					var selectedPayerCosts = $.grep(issuerPayerCosts, function(pc, index) {
						return (pc.status == "active") && (pc.installments == value.installments) && (pc.installment_rate == value.installment_rate) &&
								(pc.marketplace == selectedMarketplace()) && pc.start_date && (pc.start_date != "") && pc.expiration_date && (pc.expiration_date != "") &&
								(new Date(pc.start_date) <= new Date()) && (new Date(pc.expiration_date) >= new Date());
					})[0];
					if (selectedPayerCosts) {
						opera.postError("selectedPayerCosts: " + JSON.stringify(selectedPayerCosts));
						var sinceDate = prettyDateTime(new Date(selectedPayerCosts.start_date));
						var dueDate = prettyDateTime(new Date(selectedPayerCosts.expiration_date));
						if (sinceDate && dueDate) {
							table.push(makeBadge("promotionDates", {"##SINCE_DATE##":sinceDate, "##DUE_DATE##":dueDate}));
						}
					}
					else {
						opera.postError("There is no data about dates involving this promotion!");
					}
				}
			}
		}
		table.push("</td></tr>");
	});
	// Bank's logo
	if (selectedCardIssuer()) {
		table.push("<tr><td colspan=\"" + (amount > 0 ? 5 : 3) + "\" class=\"white-background center\">");
		table.push("<img src=\"/assets/img/cardIssuers/" + selectedCardIssuer() + ".png\" alt=\"\" title=\"" + selectedCardIssuerName() + "\" class=\"cardIssuerLogo\" /><br/>");
		if (totalFinancialCost) {
			table.push(getMsg("pricings.table.totalFinancialCost") + ": " + totalFinancialCost + " %<br/>");
		}
		table.push("<a href=\"javascript:restorePayerCosts();\">");
		table.push(getMsg("pricings.table.restore"));
		table.push("</a>");
		table.push("</td></tr>");
	}
	table.push("</table>");
	return table.join("");
}

function prettyDateTime(date) {
	var day = (date.getDate() < 10) ? "0"+date.getDate() : date.getDate();
	var month = (date.getMonth()+1 < 10) ? "0"+(date.getMonth()+1) : (date.getMonth()+1);
	var year = date.getFullYear();
	var hours = (date.getHours() < 10) ? "0"+date.getHours() : date.getHours();
	var minutes = (date.getMinutes() < 10) ? "0"+date.getMinutes() : date.getMinutes();
	return day + "/" + month + "/" + year + " " + hours + ":" + minutes;
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

function getCurrencyId() {
	return $.grep(sites, function(value, index) {
		return value.id == selectedSite();
	})[0].currencyId;
}

function changeCurrencySymbol() {
	$('#currency').text(getCurrencySymbol());
}

function updateAmounts() {
	$("#spinnerAmount").hide("fast");
	
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

function clearCollectorInternal() {
	$("#okCollector, #errorCollector, #spinnerCollector").hide("fast");
	$('#collector').val([]);
	collectorId = null;
}

function clearCollector(forceIt) {
	if ($('#collector').val() != "" || forceIt) {
		clearCollectorInternal();
		getCardsInfo();
	}
}

function updateSiteWithoutTrigger(siteId) {
	$("#sites input, #marketplaces input").unbind('change'); // Clears the trigger for the sites
	$('#sites input:checked').removeAttr("checked");
	$('#sites input').val([siteId]); // Selects the new site
	changeCurrencySymbol();
	$("#sites input, #marketplaces input").change(onChangeSiteOrMarketplaceFunction); // Restores the original behaviour
}

function supportedSite(siteId) {
	var siteIds = $.map(sites, function(value, index) {
		return value.id;
	});
	return $.inArray(siteId, siteIds) > -1;
}

function getUserInfo() {
	$.jsonp({
		url: mlapiUrls["users.by." + selectedCollectorDataType()].replace("##USER_DATA##", $('#collector').val()),
		timeout: 30000,
		pageCache: true,
		success: function(data, status) {
			$("#spinnerCollector").hide("fast");
			if (data[0] == 200) {
				if (!supportedSite(data[2].site_id)) {
					errorCollector("collectorUser.unsupportedSite");
					return;
				}
				if (data[2].site_id != selectedSite()) {
					updateSiteWithoutTrigger(data[2].site_id); // Selects the collector's site
				}
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
	$('#pricings table').remove();
	if (selectedCardIssuer()) {
		$("#pricings").append(makePricingsTable(
				exceptionsByCardIssuer[selectedCardIssuer()].payer_costs,
				exceptionsByCardIssuer[selectedCardIssuer()].total_financial_cost));
	}
	else if (selectedCard()) {
		$("#pricings").append(makePricingsTable(payerCosts), null);
	}
}

var convertedAmount = 0.0;
var conversionRatio = 1.0;
function convertAmount(amount, fromCurrency, toCurrency) {
	$.support.cors = true; // It enables cross-site scripting
	$.ajax({	// I can't use $.jsonp() because I need this request to be synchronous, and also CORS.
		url: mlapiUrls["currencyConversions"].replace("##FROM##", fromCurrency).replace("##TO##", toCurrency),
		dataType: 'json',
		async: false,
		cache: true,
		success: function(data, textStatus, XHR) {
			conversionRatio = data.ratio;
			convertedAmount = round(amount * data.ratio);
		},
		error: function(XHR, textStatus, errorThrown) {
			alert("error " + textStatus);
			opera.postError("--- Error converting " + amount + " from " + fromCurrency + " to " + toCurrency + " ---");
			opera.postError('XHR: ' + XHR);
			opera.postError('textStatus: ' + textStatus);
			opera.postError('errorThrown:' + errorThrown);
			convertedAmount = amount; // Horrible fallback...
		}
	});
	return convertedAmount;
}

function setVipItemAmount(url) {
	if (amount != 0.0) {
		return; // Abort this magic if the user already entered an amount
	}
	var h = url.match(/...-\d+/);
	if (h.length == 1) {
		h = h[0].replace(/-/, "");
		$("#spinnerAmount").show("fast");
		$.jsonp({
			url: mlapiUrls["items"].replace("##ITEM_ID##", h),
			timeout: 30000,
			pageCache: true,
			success: function(data, status) {
				if (amount != 0.0) {
					$("#spinnerAmount").hide("fast");
					return; // Abort this magic if the user already entered an amount
				}
				if (data[0] == 200) {
					if ("USD" == data[2].currency_id) {
						// Convert item's price to local currency
						var localAmount = convertAmount(data[2].price, "USD", getCurrencyId());
						if (localAmount != data[2].price) {
							// Only show the icon if the conversion succeeded
							$("#convertedAmount").attr({title: getMsg("amountToPay.converted.title").replace("##RATIO##", ""+conversionRatio)});
							$("#convertedAmount").show("fast");
						}
						$("#amount").val(localAmount);
						amount = localAmount;
					}
					else {
						// It is already in local currency
						$("#amount").val(data[2].price);
						amount = data[2].price;
					}
					updatePricingsTable();
				}
				$("#spinnerAmount").hide("fast");
			},
			error: function(XHR, textStatus, errorThrown) {
				$("#spinnerAmount").hide("fast");
				// I don't care about this... the user will have to enter the price manually.
			}
		});
	}
}

////////////////// Messaging with the injected script //////////////////

var injectedScriptPort;

function handleMessageFromInjectedScript(event) {
	opera.extension.postMessage("Message received from the injected script: " + event.data);
	
	if (event.data.indexOf("response_vip_get_url:") == 0) {
		// Put default price if available of the item being seen
		setVipItemAmount(event.data.substring("response_vip_get_url:".length));
	}
}

opera.extension.onmessage = function(event) {
	if (event.data == "Here is a port to the currently focused tab") {
		if (event.ports.length > 0) {
		injectedScriptPort = event.ports[0];
			injectedScriptPort.onmessage = handleMessageFromInjectedScript;
		}
	}
}

function sendMessageToInjectedScript(message) {
	if (injectedScriptPort) {
		injectedScriptPort.postMessage(message);
		opera.postError('the send sent is: ' + message);
	}
}

////////////////// Messaging with the injected script //////////////////
