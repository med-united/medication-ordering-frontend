sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/m/MessageToast'
], function (Controller, MessageToast) {
	"use strict";

	return Controller.extend("webapp.controller.Medication", {

		onInit: function(){
			this.initializeRouter();
		},

		initializeRouter: function(){
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		},

		onAvatarPressed: function () {
			MessageToast.show("Avatar pressed!");
		},

		goToPharmacy: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("pharmacy");
		},

		changeView: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var sKey = oEvent.getParameter("key");
			oRouter.navTo(sKey);
		}
	});
});