sap.ui.define([
	'sap/ui/core/mvc/Controller',
], function (Controller) {
	"use strict";

	return Controller.extend("webapp.controller.Start", {

		onInit: function () {
			this.initializeRouter();
		},

		initializeRouter: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		},

		onAvatarPressed: function () {
			MessageToast.show("Avatar pressed!");
		},

		changeView: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var sKey = oEvent.getParameter("key");
			oRouter.navTo(sKey);
		}
	});
});
