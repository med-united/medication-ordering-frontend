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
				if(oEvent.getParameter("name") == "add") {
					this.onRouteAddMatched(oEvent);
				}
			}.bind(this));
			
			this.oRouter.attachRouteMatched(function(oEvent) {
				if(oEvent.getParameter("name") == "search") {
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
			this.byId(this.getEntityName()+"Table").getBinding("items").filter(aFilters, FilterType.Application);
		},
		onListItemPress: function (oEvent) {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1),
				entityPath = oEvent.getSource().getBindingContext().getPath(),
				entity = entityPath.split("/").slice(-1).pop();

			var oParams = {layout: oNextUIState.layout};
			oParams[this.getEntityName()] = entity;
			this.oRouter.navTo(this.getEntityName()+"-detail", oParams);
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = this.getFilter(sQuery);
			}

			this.getView().byId(this.getEntityName()+"Table").getBinding("items").filter(oTableSearchState, "Application");
		},
		getFilter: function(sQuery) {
			return [new Filter(this.getSearchField(), FilterOperator.Contains, sQuery)];
		},
		onAdd: function (oEvent) {
			this.oRouter.navTo("add");
		},
		onRouteAddMatched: function(oEvent) {
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
		getPackageName: function() {
			return this.getEntityName();
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
			return this.getOwnerComponent().getModel().createEntry("/"+sEntityName+"s")
		},
		onSave: function (oEvent) {
			/*this.getOwnerComponent().getModel().submitChanges({
				"success": function (oData) {
					if("__batchResponses" in oData) {
						var aErrors = oData.__batchResponses.filter(function (oResponse) {
							return "message" in oResponse;
						})
						if(aErrors.length > 0) {
							MessageBox.error(this.translate("ErrorDuringCreating_"+this.getEntityName(), [aErrors[0].response.statusText, aErrors[0].response.body]));
						} else {
							MessageToast.show(this.translate("SuccessfullyCreated_"+this.getEntityName()));
							this.byId("createAndEditDialog").close();
						}
					} else {						
						MessageToast.show(this.translate("SuccessfullyCreated_"+this.getEntityName()));
						this.byId("createAndEditDialog").close();
					}
				}.bind(this),
				"error": function (oError) {
					MessageBox.error(this.translate("ErrorDuringCreating_"+this.getEntityName(), [oError]));
				}.bind(this)
			});*/
		},
		onCancel: function (oEvent) {
			this.getOwnerComponent().getModel().resetChanges();
			oEvent.getSource().getParent().close();
		},
		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId(this.getEntityName()+"Table"),
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