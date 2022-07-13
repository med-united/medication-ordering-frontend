sap.ui.define([
], function () {
    "use strict";
    return {

        _isDemoAccount(view) {
			const email = view.getModel("JWT").getProperty("/email")
			return email === "med.united@test.de"
		},
    };
}, true);