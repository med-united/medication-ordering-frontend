sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"./AbstractController",
	'sap/m/MessageBox',
	'sap/m/MessageToast',
	"sap/ui/core/Fragment"
], function (JSONModel, AbstractController, MessageBox, MessageToast, Fragment) {
	"use strict";

	return AbstractController.extend("medunited.base.controller.AbstractDetailController", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();

			// this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-master").attachPatternMatched(this._onMatched, this);
			this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-detail").attachPatternMatched(this._onMatched, this);
		},
		handleFullScreen: function () {
			this.navToLayoutProperty("/actionButtonsInfo/midColumn/fullScreen");
		},
		navToLayoutProperty: function(sLayoutProperty) {
			var oLayoutModel = this.getOwnerComponent().getModel("Layout");
			var sNextLayout = oLayoutModel.getProperty(sLayoutProperty);
			var oParams = {layout: sNextLayout};
			oParams[this.getEntityName().toLowerCase()] = this._entity;
			this.oRouter.navTo(this.getEntityName().toLowerCase()+"-detail", oParams);
		},
		handleExitFullScreen: function () {
			this.navToLayoutProperty("/actionButtonsInfo/midColumn/exitFullScreen");
		},
		handleClose: function () {
			var oLayoutModel = this.getOwnerComponent().getModel("Layout");
			var sNextLayout = oLayoutModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo(this.getEntityName().toLowerCase()+"-master", {layout: sNextLayout});
		},
		onEdit: function(){
            this.enableEditMode(true);
        },
		onSave: function (oEvent) {
            var fnSuccess = function(oData){
                this.enableEditMode(false);
                MessageToast.show(this.translate("msgPatientSaved"));
            }.bind(this);

            var fnError = function(oError){
                this.enableEditMode(false);
                MessageBox.show(this.translate("msgPatientSavedFailed", [oError.statusCode, oError.statusText]));
            }.bind(this);

            var oRequest = this.getView().getModel().submitChanges(this.getEntityName().toLowerCase()+"Details", fnSuccess, fnError);
            if(!oRequest){
                this.enableEditMode(false);
            }
		},
		onCancel: function(oEvent) {
			this.enableEditMode(false);
            this.getView().getModel().resetChanges();
		},
		onDelete: function (oEvent) {
			/*this.getOwnerComponent().getModel().remove(this.getView().getBindingContext().getPath(), {
				"success": function () {
					MessageToast.show(this.translate("SuccessfullyDeleted_"+this.getEntityName()));
				}.bind(this)
			});*/
			this.getOwnerComponent().getRouter().navTo("master");
			
		},
		_onMatched: function (oEvent) {
			this._entity = oEvent.getParameter("arguments")[this.getEntityName().toLowerCase()];
			this.getView().bindElement({
				path: "/" + this.getEntityName() + "/" + this._entity,
				parameters: this.getBindElementParams()
			});
		},
		getBindElementParams: function () {
			return {};
		},
		getEntityName : function () {
			throw new Error("getEntityName must be implemented by derived class");
		},
		onExit: function () {
			this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-master").detachPatternMatched(this._onMatched, this);
			this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-detail").detachPatternMatched(this._onMatched, this);
		},
		enableEditMode: function(bEditMode){
            this.getView().getModel("appState").setProperty("/editMode", bEditMode);
        }
	});
}, true);