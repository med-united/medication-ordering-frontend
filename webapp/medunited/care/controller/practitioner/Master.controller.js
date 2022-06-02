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

				const size = 0.1; // 0.1 => 11.1 km
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
			
			let doctorFullName = oDoctorFromOSM["name"];
			let doctorGivenName = "";
			let doctorFamilyName = "";
			let phoneNumber = "";
			let emailAddress = "";

			let doctorsPrefixes = ["Dr. med ", "Dr. med. ", "Dr.-Med. ", "Dr. ", "Dipl.- Med. ", "Dipl.-Med. ", "Dipl. med. "];
			let punctuationAndSymbols = [",", ";", "/"];
			// Alphabetically ordered
			let acronyms = ["MVZ", "HNO"]
			let otherMedicalTerms = ["allgemeinarzt", "allgemeinmedizin", "augenarzt", "augenärzt", "augenheilkunde", "gastroent", "kardiolo", "kinder", "klinik", "institut",
									"medical", "medizin", "platz", "praxis", "psych", "therapie", "zentrum"]
			let allElementsThatDontBelongInName = punctuationAndSymbols.concat(acronyms).concat(otherMedicalTerms);

			for (let prefix of doctorsPrefixes) {
				if (doctorFullName.includes(prefix)) {
					doctorFullName = doctorFullName.replace(prefix, "");
				}
			}
			let checkIfElementExists = false;
			for (let element of allElementsThatDontBelongInName) {
				if (doctorFullName.includes(element) || doctorFullName.toLowerCase().includes(element)) {
					checkIfElementExists = true;
					break;
				}
			}
			if (checkIfElementExists === false) {
				let wordsInDoctorFullName = doctorFullName.split(" ");
				if (wordsInDoctorFullName.length > 1) {
					doctorGivenName = wordsInDoctorFullName[0];
					doctorFamilyName = wordsInDoctorFullName[wordsInDoctorFullName.length - 1];
				}
			}

			this.byId("givenName").setValue(doctorGivenName);
			this.byId("familyName").setValue(doctorFamilyName);

			this.byId("street").setValue(oDoctorFromOSM["addr:street"]);
			this.byId("postalCode").setValue(oDoctorFromOSM["addr:postcode"]);
			this.byId("city").setValue(oDoctorFromOSM["addr:city"]);

			if (!oDoctorFromOSM["contact:email"] && oDoctorFromOSM["email"]) {
				emailAddress = oDoctorFromOSM["email"];
			}
			else if (!oDoctorFromOSM["email"] && oDoctorFromOSM["contact:email"]) {
				emailAddress = oDoctorFromOSM["contact:email"];
			}
			else if (oDoctorFromOSM["contact:email"] && oDoctorFromOSM["email"]) {
				emailAddress = oDoctorFromOSM["contact:email"];
			}

			this.byId("email").setValue(emailAddress);

			if (!oDoctorFromOSM["contact:phone"] && oDoctorFromOSM["phone"]) {
				phoneNumber = oDoctorFromOSM["phone"];
			}
			else if (!oDoctorFromOSM["phone"] && oDoctorFromOSM["contact:phone"]) {
				phoneNumber = oDoctorFromOSM["contact:phone"];
			}
			else if (oDoctorFromOSM["contact:phone"] && oDoctorFromOSM["phone"]) {
				phoneNumber = oDoctorFromOSM["contact:phone"];
			}
			this.byId("phone").setValue(phoneNumber);
		}
	});
}, true);