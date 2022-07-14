sap.ui.define([
    "sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException"
], function (SimpleType, ValidateException) {
    "use strict";

        return SimpleType.extend("customTypePostalCode", {
			formatValue: function (oValue) {
				return oValue;
			},
			parseValue: function (oValue) {
				return oValue;
			},
			validateValue: function (oValue) {
                // will match only letters and spaces
				var postalCodeRegex = /^[0-9]{5}$/;
				if (!oValue.match(postalCodeRegex)) {
					throw new ValidateException("'" + oValue + "' is not a valid postal code");
				}
			}
		});
});