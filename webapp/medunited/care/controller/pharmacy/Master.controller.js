sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function (AbstractMasterController, Filter, FilterOperator) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.pharmacy.Master", {
		getEntityName: function() {
			return "Pharmacy";
		},
		getFilter: function(sQuery) {
			return [new Filter({
				filters: [
					new Filter("name", FilterOperator.Contains, sQuery)
				],
				and: false
				}
			)];
		},
		getSortField: function() {
			return "name";
		}
	});
}, true);