sap.ui.define([
    "sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException"
], function (SimpleType, ValidateException) {
    "use strict";

        return SimpleType.extend("customTypeName", {
			formatValue: function (oValue) {
				return oValue;
			},
			parseValue: function (oValue) {
				return oValue;
			},
			validateValue: function (oValue) {
                // will match only letters and spaces
				var nameRegex = /^[a-zA-Z ]*$/;
				if (!oValue.match(nameRegex)) {
					throw new ValidateException("'" + oValue + "' is not a valid name");
				}
			}
		});
});