sap.ui.define([
    "sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException"
], function (SimpleType, ValidateException) {
    "use strict";

        return SimpleType.extend("customTypeDate", {
			formatValue: function (oValue) {
				return oValue;
			},
			parseValue: function (oValue) {
				return oValue;
			},
			validateValue: function (oValue) {
                // will match yyyy-mm-dd
				var dateRegex = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
				if (!oValue.match(dateRegex)) {
					throw new ValidateException("'" + oValue + "' is not a valid date");
				}
			}
		});
});