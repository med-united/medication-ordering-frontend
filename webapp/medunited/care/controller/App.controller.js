sap.ui.define([
	"sap/ui/core/ResizeHandler",
	"medunited/base/controller/AbstractController",
	"sap/f/FlexibleColumnLayout",
	"sap/base/Log",
	"medunited/base/jwt/JWTUtil"
], function (ResizeHandler, AbstractController, FlexibleColumnLayout, Log, JWTUtil) {
	"use strict";

	return AbstractController.extend("medunited.care.controller.App", {
		onInit: function () {
			var oComponent = this.getOwnerComponent();
			if(oComponent) {				
				this.oRouter = oComponent.getRouter();
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				ResizeHandler.register(this.getView().byId("fcl"), this._onResize.bind(this));
			} else {
				Log.warning("Could not get component for AbstractAppController for entity: "+this.getEntityName());
			}
		},
		changeTab: function(oEvent) {
			this.getOwnerComponent().getRouter().navTo(oEvent.getParameter("key"));
		},
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name"),
				oArguments = oEvent.getParameter("arguments");

			var oModel = this.getOwnerComponent().getModel("Layout");
			
			var sLayout = oEvent.getParameters().arguments.layout;
			
			// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
			if (!sLayout) {
				var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
				sLayout = oNextUIState.layout;
			}
			
			// Update the layout of the FlexibleColumnLayout
			if (sLayout) {
				oModel.setProperty("/layout", sLayout);
			}

			this._updateUIElements();

			// Save the current route name
			this.currentRouteName = sRouteName;
			this.entityName = sRouteName.split("-")[0];
			this.currentEntity = oArguments[this.entityName];
		},
		onStateChanged: function (oEvent) {
			var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
				sLayout = oEvent.getParameter("layout");

			this._updateUIElements();

			// Replace the URL with the new layout if a navigation arrow was used
			if (bIsNavigationArrow) {
				var oParams = {layout: sLayout};
				oParams[this.entityName] = this.currentEntity;
				this.oRouter.navTo(this.currentRouteName, oParams, true);
			}
		},

		// Update the close/fullscreen buttons visibility
		_updateUIElements: function () {
			var oModel = this.getOwnerComponent().getModel("Layout");
			var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();
			oModel.setData(oUIState);
		},
		_onResize: function(oEvent) {
			var bPhone = (oEvent.size.width < FlexibleColumnLayout.TABLET_BREAKPOINT);
			this.getOwnerComponent().getModel("Layout").setProperty("/isPhone", bPhone);
		},

		onExit: function () {
			try {
				this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			} catch(e) {
				Log.warning(e);
			}
		},
		formatJwtName: function(sGivenName, sFamilyName) {
			try {
				if(!sGivenName || !sFamilyName) {
					return "";
				}
				return JWTUtil.getSalutation(sGivenName, sFamilyName);
			} catch(e) {
				console.error("Exception while formatting name: "+e);
			}
		}
	});
}, true);