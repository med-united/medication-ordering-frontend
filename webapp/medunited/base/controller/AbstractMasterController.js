sap.ui.define([
	"./AbstractController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterType",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	'sap/m/MessageToast',
	"sap/ui/core/Fragment"
], function (AbstractController, Filter, FilterType, FilterOperator, Sorter, MessageBox, MessageToast, Fragment) {
	"use strict";

	return AbstractController.extend("medunited.base.controller.AbstractMasterController", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			
			this.oRouter.attachRouteMatched(function(oEvent) {
				if(oEvent.getParameter("name") == this.getEntityName().toLowerCase()+"-add") {
					this.onRouteAddMatched(oEvent);
				}
			}.bind(this));
			
			this.oRouter.attachRouteMatched(function(oEvent) {
				if(oEvent.getParameter("name") == this.getEntityName().toLowerCase()+"-search") {
					this.onRouteSearchMatched(oEvent);
				}
			}.bind(this));
			
			this._bDescendingSort = false;
		},
		onRouteSearchMatched: function(oEvent) {
			let sQuery = oEvent.getParameter("arguments").query;
			
			let aQueryParts = sQuery.split(/&/).map(s => s.split(/=/)).map(a => [a[0].replace("_", "/"), a[1]]);
			
			let aFilters = [];
			for(let aPart of aQueryParts) {
				let sField = aPart[0];
				let sValue = aPart[1];
				aFilters.push(new Filter({path: sField, operator: FilterOperator.EQ, value1: sValue}));
			}
			this.byId(this.getEntityName().toLowerCase()+"Table").getBinding("items").filter(aFilters, FilterType.Application);
		},
		onListItemPress: function (oEvent) {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1),
				entityPath = oEvent.getSource().getBindingContext().getPath(),
				entity = entityPath.split("/").slice(-1).pop();

			var oParams = {layout: oNextUIState.layout};
			oParams[this.getEntityName().toLowerCase()] = entity;
			this.oRouter.navTo(this.getEntityName().toLowerCase()+"-detail", oParams);
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = this.getFilter(sQuery);
			}
			this.getView().byId(this.getEntityName().toLowerCase()+"Table").getBinding("items").filter(oTableSearchState, "Application");
		},
		getFilter: function(sQuery) {
			return [new Filter(this.getSearchField(), FilterOperator.Contains, sQuery)];
		},
		onAdd: function (oEvent) {
			this.oRouter.navTo(this.getEntityName().toLowerCase()+"-add");
		},
		onRouteAddMatched: function(oEvent) {
			var oView = this.getView();

			// create dialog lazily
			if (!this.byId("createDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "medunited.care.view."+this.getEntityName().toLowerCase()+".CreateDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					this._openCreateDialog(oDialog);
				}.bind(this));
			} else {
				this._openCreateDialog(this.byId("createDialog"));
			}
		},
		getPackageName: function() {
			return this.getEntityName().toLowerCase();
		},
		getEntityName : function () {
			throw new Error("getEntityName must be implemented by derived class");
		},
		_openCreateDialog: function (oDialog, sEntityName) {
			oDialog.open();
			
			if(sEntityName === undefined) {	
				sEntityName = this.getEntityName();
				sEntityName = sEntityName[0].toUpperCase() + sEntityName.slice(1);
			}
			
			var oContext = this._createContextFromModel(sEntityName);
			oDialog.setBindingContext(oContext);
		},
		_createContextFromModel: function (sEntityName) {
			var sEntityId = this.getView().getModel().create(sEntityName, {}, "patientDetails");
			this.onSave();
			return this.getOwnerComponent().getModel().bindContext("/"+sEntityName+"/"+sEntityId);
		},
		onSave: function (oEvent) {
			var fnSuccess = function(oData){
                this.enableEditMode(false);
                MessageToast.show(this.translate(this, "msgPatientSaved"));
            }.bind(this);

            var fnError = function(oError){
                this.enableEditMode(false);
                MessageBox.show(this.translate("msgPatientSavedFailed", [oError.statusCode, oError.statusText]));
            }.bind(this);

            var oRequest = this.getView().getModel().submitChanges(this.getEntityName().toLowerCase()+"Details", fnSuccess, fnError);
		},
		onCancel: function (oEvent) {
			this.getOwnerComponent().getModel().resetChanges();
			oEvent.getSource().getParent().close();
		},
		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId(this.getEntityName().toLowerCase()+"Table"),
				oBinding = oTable.getBinding("items"),
				oSorter = new Sorter(this.getSortField(), this._bDescendingSort);

			oBinding.sort(oSorter);
		},
		getSearchField: function () {
			return this.getSortField();
		},
		getSortField: function () {
			return "Name";
		}
	});
}, true);