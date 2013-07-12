// Spanish translation (es)

var msg = new Array();

function getMsg(id, replacements) {
	var message = msg[id];
	if (message && replacements) {
		for (var key in replacements) {
			message = message.replace(key, replacements[key]);
		}
	}
	return message;
}

msg["extension.name"] = "Calculador de cuotas de MercadoPago";
msg["marketplaces.legend"] = "Seleccione el sitio sobre el que va a operar";
msg["sites.legend"] = "Seleccione el país sobre el que va a operar";
msg["additionalData.legend"] = "Datos adicionales (opcionales)";
msg["amountToPay.label"] = "Monto a pagar ";
msg["amountToPay.converted.alt"] = "Convertido a la moneda local";
msg["amountToPay.converted.title"] = "Convertido a la moneda local usando la razón de conversión actual de ##RATIO## de MercadoPago.";
msg["amountToPay.clear.alt"] = "Limpiar monto";
msg["amountToPay.clear.title"] = "Limpiar monto";
msg["amountToPay.help.alt"] = "Ayuda";
msg["amountToPay.help.title"] = "Puede ingresar el monto a pagar para calcular el monto total con interés y en cuotas";
msg["collectorUser.label"] = "Vendedor ";
msg["collectorUser.submit.alt"] = "Ingresar vendedor";
msg["collectorUser.submit.title"] = "Ingresar vendedor";
msg["collectorUser.ok.alt"] = "Vendedor identificado";
msg["collectorUser.ok.title"] = "Vendedor identificado";
msg["collectorUser.error.alt"] = "Vendedor inválido";
msg["collectorUser.error.title"] = "Vendedor inválido";
msg["collectorUser.error.nickname"] = "El nickname del vendedor es inválido";
msg["collectorUser.error.email"] = "El e-mail del vendedor es inválido";
msg["collectorUser.error.id"] = "El ID del vendedor es inválido";
msg["collectorUser.invalid.nickname"] = "El nickname ingresado es inválido";
msg["collectorUser.invalid.email"] = "El e-mail ingresado es inválido, verifique el formato.";
msg["collectorUser.invalid.id"] = "El ID ingresado es inválido, deben ser sólo números.";
msg["collectorUser.notFound.nickname"] = "El usuario no existe, revise el nickname ingresado.";
msg["collectorUser.notFound.email"] = "El usuario no existe, revise la dirección de e-mail ingresada.";
msg["collectorUser.notFound.id"] = "El usuario no existe, revise el ID ingresado.";
msg["collectorUser.unsupportedSite"] = "El usuario pertenece a un país no soportado.";
msg["collectorUser.clear.alt"] = "Limpiar vendedor";
msg["collectorUser.clear.title"] = "Limpiar vendedor";
msg["collectorUser.help.alt"] = "Ayuda";
msg["collectorUser.help.title"] = "Algunos vendedores (principalmente los grandes), poseen sus propias promociones personalizadas. Si conoces a tu vendedor, puedes ingresarlo para obtener sus pricings específicos.";
msg["collectorUser.dataType.nickname"] = "Nickname";
msg["collectorUser.dataType.email"] = "E-mail";
msg["collectorUser.dataType.id"] = "ID";
msg["cards.legend"] = "Seleccione la tarjeta";
msg["pricings.legend"] = "Pricings disponibles";
msg["cardIssuers.legend"] = "Bancos con promociones disponibles";
msg["sites.MLA.name"] = "Argentina";
msg["sites.MLB.name"] = "Brasil";
msg["sites.MLC.name"] = "Chile";
msg["sites.MCO.name"] = "Colombia";
msg["sites.MLM.name"] = "México";
msg["sites.MLV.name"] = "Venezuela";
msg["badges.promotion.description"] = "Promoción sin interés";
msg["badges.promotionDates.description"] = "Promoción válida desde el ##SINCE_DATE## hasta el ##DUE_DATE##";
msg["badges.interestDeduction.description"] = "El vendedor absorbe los costos de financiación";
msg["pricings.table.installments"] = "Cuotas";
msg["pricings.table.installmentRate"] = "Interés";
msg["pricings.table.totalAmount"] = "Monto<br />total";
msg["pricings.table.installmentAmount"] = "Monto<br />por cuota";
msg["pricings.table.extras"] = "Extras";
msg["pricings.table.totalFinancialCost"] = "Costo financiero total";
msg["pricings.table.restore"] = "Restablecer pricings originales de la tarjeta";
msg["cardIssuers.none"] = "Actualmente no hay bancos con<br />promociones para esta tarjeta";
msg["error.ups"] = "Ups... hubo un error. Por favor informámelo a sebastiangun@gmail.com con los pasos a seguir para reproducirlo. Gracias!";
msg["error.mlapi"] = "La API de MercadoLibre no parece estar respondiendo. Por favor intenta de nuevo en unos minutos.";
