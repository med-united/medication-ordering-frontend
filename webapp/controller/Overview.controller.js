sap.ui.define([
	'sap/ui/core/mvc/Controller',
], function (Controller) {
	"use strict";

	return Controller.extend("webapp.controller.Overview", {

		onInit: function () {
			this.initializeRouter();
		},

		initializeRouter: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		},

		goToPharmacy: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("pharmacy");
		},

		changeTab: function (oEvent) {
			var sKey = oEvent.getParameter("key");
			var container = this.byId("viewContainer");
			container.removeAllContent();
			container.addContent(
				new sap.ui.view({
					viewName: "webapp.view." + sKey,
					type: "XML"
				})
			);
		}
	});
});
