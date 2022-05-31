sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/json/JSONModel'
], function (AbstractMasterController, Filter, FilterOperator, JSONModel) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.organization.Master", {
		getEntityName: function() {
			return "Organization";
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
		},
		onAfterCreateOpenDialog: function (oEvent) {
			var oSuggestionModel = new JSONModel();
			navigator.geolocation.getCurrentPosition(function(position) {

				const size = 0.1; // 0.1 => 11.1 km
				const upperLeft = position.coords.latitude-size;
				const upperRight = position.coords.longitude-size;
				const lowerLeft = position.coords.latitude+size;
				const lowerRight = position.coords.longitude+size;

				var loaded = oSuggestionModel.loadData("https://www.overpass-api.de/api/interpreter?data=[out:json];"+
				"node[amenity=pharmacy][%22name%22]("+
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
			const oPharmacyFromOSM = oItem.getBindingContext("Suggestions").getProperty("tags");

			this.byId("pharmacyName").setValue(oPharmacyFromOSM["name"]);
			this.byId("pharmacyAddress").setValue(oPharmacyFromOSM["addr:street"]);
			this.byId("pharmacyPostalCode").setValue(oPharmacyFromOSM["addr:postcode"]);
			this.byId("pharmacyCity").setValue(oPharmacyFromOSM["addr:city"]);

			let phoneNumber = "";
			let emailAddress = "";

			if (!oPharmacyFromOSM["contact:email"] && oPharmacyFromOSM["email"]) {
				emailAddress = oPharmacyFromOSM["email"];
			}
			else if (!oPharmacyFromOSM["email"] && oPharmacyFromOSM["contact:email"]) {
				emailAddress = oPharmacyFromOSM["contact:email"];
			}
			else if (oPharmacyFromOSM["contact:email"] && oPharmacyFromOSM["email"]) {
				emailAddress = oPharmacyFromOSM["contact:email"];
			}
			this.byId("pharmacyEmail").setValue(emailAddress);

			if (!oPharmacyFromOSM["contact:phone"] && oPharmacyFromOSM["phone"]) {
				phoneNumber = oPharmacyFromOSM["phone"];
			}
			else if (!oPharmacyFromOSM["phone"] && oPharmacyFromOSM["contact:phone"]) {
				phoneNumber = oPharmacyFromOSM["contact:phone"];
			}
			else if (oPharmacyFromOSM["contact:phone"] && oPharmacyFromOSM["phone"]) {
				phoneNumber = oPharmacyFromOSM["contact:phone"];
			}
			this.byId("pharmacyPhone").setValue(phoneNumber);
		}
	});
}, true);