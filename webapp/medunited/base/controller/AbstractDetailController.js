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

			this.oRouter.getRoute(this.getEntityName()+"-master").attachPatternMatched(this._onMatched, this);
			this.oRouter.getRoute(this.getEntityName()+"-detail").attachPatternMatched(this._onMatched, this);
		},
		handleFullScreen: function () {
			this.navToLayoutProperty("/actionButtonsInfo/midColumn/fullScreen");
		},
		navToLayoutProperty: function(sLayoutProperty) {
			var oLayoutModel = this.getOwnerComponent().getModel("Layout");
			var sNextLayout = oLayoutModel.getProperty(sLayoutProperty);
			var oParams = {layout: sNextLayout};
			oParams[this.getEntityName()] = this._entity;
			this.oRouter.navTo(this.getEntityName()+"-detail", oParams);
		},
		handleExitFullScreen: function () {
			this.navToLayoutProperty("/actionButtonsInfo/midColumn/exitFullScreen");
		},
		handleClose: function () {
			var oLayoutModel = this.getOwnerComponent().getModel("Layout");
			var sNextLayout = oLayoutModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo(this.getEntityName()+"-master", {layout: sNextLayout});
		},
		onEdit: function() {
			var oView = this.getView();
			// create dialog lazily
			if (!this.byId("createAndEditDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "medunited.care.view."+this.getEntityName()+".CreateAndEditDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					this._openCreateDialog(oDialog);
				}.bind(this));
			} else {
				this._openCreateDialog(this.byId("createAndEditDialog"));
			}
		},
		_openCreateDialog: function (oDialog) {
			oDialog.open();
		},
		onSave: function (oEvent) {
            // TODO
			/*this.getOwnerComponent().getModel().submitChanges({
				"success": function (oData) {
					if("__batchResponses" in oData) {
						var aErrors = oData.__batchResponses.filter(function (oResponse) {
							return "message" in oResponse;
						})
						if(aErrors.length > 0) {
							MessageBox.error(this.translate("ErrorDuringSaving_"+this.getEntityName(), [aErrors[0].response.statusText, aErrors[0].response.body]));
						} else {
							MessageToast.show(this.translate("SuccessfullySaved_"+this.getEntityName()));
							this.byId("createAndEditDialog").close();
						}
					} else {						
						MessageToast.show(this.translate("SuccessfullySaved_"+this.getEntityName()));
						this.byId("createAndEditDialog").close();
					}
				}.bind(this),
				"error": function (oError) {
					MessageBox.error(this.translate("ErrorDuringSaving_"+this.getEntityName(), [oError]));
				}.bind(this)
			});*/
		},
		onCancel: function(oEvent) {
			// this.getOwnerComponent().getModel().resetChanges();
			this.byId("createAndEditDialog").close();
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
			this._entity = oEvent.getParameter("arguments")[this.getEntityName()];
			this.getView().bindElement({
				path: "/" + this._entity,
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
			this.oRouter.getRoute(this.getEntityName()+"-master").detachPatternMatched(this._onMatched, this);
			this.oRouter.getRoute(this.getEntityName()+"-detail").detachPatternMatched(this._onMatched, this);
		}
	});
}, true);