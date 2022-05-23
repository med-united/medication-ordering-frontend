sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function (AbstractMasterController, Filter, FilterOperator) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.practitioner.Master", {
		getEntityName: function() {
			return "Practitioner";
		},
		getFilter: function(sQuery) {
			return [new Filter({
				filters: [
					new Filter("given", FilterOperator.Contains, sQuery),
					new Filter("family", FilterOperator.Contains, sQuery)
				],
				and: false
				}
			)];
		},
		getSortField: function() {
			return "family";
		},
		onSuggest: function (oEvent) {
			var oSource = oEvent.getSource();
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("tags/name", FilterOperator.StartsWith, sTerm));
				console.log(new Filter("tags/name", FilterOperator.StartsWith, sTerm));
			}
			var oBinding = oSource.getBinding("suggestionItems");
			oBinding.filter(aFilters);
			oBinding.attachEventOnce("dataReceived", function() { // Never entered
				console.log("dataReceived event");
				oSource.suggest();
			});
			// allows to see the indexes of the elements that match the letters inserted:
			console.log(oEvent.getSource().getBinding("suggestionItems").filter(aFilters));
			// allows to see the items and the number of results returned from the JSON overpass-api response that match the letters inserted:
			console.log(oEvent.getSource().getAggregation("suggestionItems"));
		}
	});
}, true);