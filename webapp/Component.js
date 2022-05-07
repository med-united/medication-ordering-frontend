sap.ui.define([
	"sap/ui/core/UIComponent"
], function (UIComponent) {
	"use strict";

	return UIComponent.extend("webapp.Component", {

		metadata : {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		init: function() {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			var oRouter = this.getRouter();
			const keycloak = new Keycloak();
            keycloak.init({"onLoad":"login-required"}).then(function(authenticated) {
                console.log(authenticated ? 'authenticated' : 'not authenticated');
				if(authenticated) {
					// Add JWT token to all jQuery ajax requests
					// This will work with the FHIR Model
					// https://github.com/SAP/openui5-fhir/blob/v2.3.0/src/sap/fhir/model/r4/lib/FHIRRequestor.js#L324
					$.ajaxSetup({
						headers: { 'Authorization': 'Bearer ' + keycloak.token }
					});
					oRouter.navTo("overview");
				}
            }).catch(function(e) {
                console.log('failed to initialize');
            });

		}
	});

});