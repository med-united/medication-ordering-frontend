sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/json/JSONModel'
], function (AbstractMasterController, Filter, FilterOperator, JSONModel) {
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
		onAfterCreateOpenDialog: function (oEvent) {
			var oSuggestionModel = new JSONModel();
			navigator.geolocation.getCurrentPosition(function(position) {

				const size = 0.1;
				const upperLeft = position.coords.latitude-size;
				const upperRight = position.coords.longitude-size;
				const lowerLeft = position.coords.latitude+size;
				const lowerRight = position.coords.longitude+size;

				var loaded = oSuggestionModel.loadData("https://www.overpass-api.de/api/interpreter?data=[out:json];"+
				"node[amenity=doctors][%22name%22]("+
				upperLeft+","+
				upperRight+","+
				lowerLeft+","+
				lowerRight
				+");out%20center;");
			});
			this.byId("search").setBusy(true);
			this.getView().setModel(oSuggestionModel, "Suggestions");
			oSuggestionModel.attachRequestCompleted(() => {
				this.byId("search").setBusy(false);
			})
		},
		onSuggestionItemSelected: function (oEvent) {
			const oItem = oEvent.getParameter("selectedItem");
			const oDoctorFromOSM = oItem.getBindingContext("Suggestions").getProperty("tags");
			// addr:city: "Berlin"
			// addr:country: "DE"
			// addr:housenumber: "18"
			// addr:postcode: "10707"
			// addr:street: "Pariser Straße"
			// addr:suburb: "Wilmersdorf"
			// amenity: "doctors"
			// contact:website: "https://www.praxis-marcelberger.de/"
			// healthcare: "doctor"
			// healthcare:speciality: "internal"
			// name: "Praxis Marcel Berger"
			// wheelchair: "no"
			this.byId("city").setValue(oDoctorFromOSM["addr:city"]);
		}
	});
}, true);