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
                // will match any kind of letter from any language, spaces and hyphen
				let nameRegex = /^[\p{L} -]*$/u;
				let testSpaces = oValue;
				if (!testSpaces.replace(/\s/g, '').length && oValue.length > 0) {
					throw new ValidateException("Only whitespaces detected");
				}
				else if (!oValue.match(nameRegex)) {
					throw new ValidateException("'" + oValue + "' is not a valid name");
				}
			}
		});
});