sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/f/FlexibleColumnLayoutSemanticHelper"
], function (UIComponent, JSONModel, FlexibleColumnLayoutSemanticHelper) {
	"use strict";

	return UIComponent.extend("medunited.care.Component", {

		metadata : {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		init: function() {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			var oRouter = this.getRouter();
			const keycloak = new Keycloak();

			var oJwtModel = new JSONModel();
			this.setModel(oJwtModel, "JWT");

			const me = this;

            keycloak.init({"onLoad":"login-required"}).then(function(authenticated) {
                console.log(authenticated ? 'authenticated' : 'not authenticated');
				if(authenticated) {
					// Add JWT token to all jQuery ajax requests
					// This will work with the FHIR Model
					// https://github.com/SAP/openui5-fhir/blob/v2.3.0/src/sap/fhir/model/r4/lib/FHIRRequestor.js#L324
					$.ajaxSetup({
						headers: { 'Authorization': 'Bearer ' + keycloak.token }
					});
					oJwtModel.setData(me.parseJwt(keycloak.token));
					oRouter.navTo("patient-master");
				}
            }).catch(function(e) {
                console.log('failed to initialize');
            });

			var oModel = new JSONModel();
			this.setModel(oModel, "Layout");

		},

		/**
		 * Parse a json token payload that is base64 encoded.
		 * 
		 * @param {string} token 
		 * @returns 
		 */
		parseJwt: function (token) {
			var base64Url = token.split('.')[1];
			var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));
		
			return JSON.parse(jsonPayload);
		},

		/**
		 * Returns an instance of the semantic helper
		 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
		 */
		 getHelper: function () {
			var oFCL = this.getRootControl().byId("fcl"),
				oParams = jQuery.sap.getUriParameters(),
				oSettings = {
					defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded,
					mode: oParams.get("mode"),
					initialColumnsCount: oParams.get("initial"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		}
	});

});