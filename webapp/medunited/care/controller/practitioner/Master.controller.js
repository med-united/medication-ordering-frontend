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

			let doctorFullName = oDoctorFromOSM["name"];
			let doctorGivenName = "";
			let doctorFamilyName = "";
			let phoneNumber = "";
			let emailAddress = "";
			if (doctorFullName.includes("Dr. med ")) {
				doctorFullName = doctorFullName.replace("Dr. med ", "");
			} else if (doctorFullName.includes("Dr. med. ")) {
				doctorFullName = doctorFullName.replace("Dr. med. ", "");
			} else if (doctorFullName.includes("Dr.-Med. ")) {
				doctorFullName = doctorFullName.replace("Dr.-Med. ", "");
			} else if (doctorFullName.includes("Dr. ")) {
				doctorFullName = doctorFullName.replace("Dr. ", "");
			} else if (doctorFullName.includes("Dipl.- Med. ")) {
				doctorFullName = doctorFullName.replace("Dipl.- Med. ", "");
			} else if (doctorFullName.includes("Dipl.-Med. ")) {
				doctorFullName = doctorFullName.replace("Dipl.-Med. ", "");
			} else if (doctorFullName.includes("Dipl. med. ")) {
				doctorFullName = doctorFullName.replace("Dipl. med. ", "");
			};
			if (!doctorFullName.includes(",") &&
				!doctorFullName.includes(";") &&
				!doctorFullName.includes("-") &&
				!doctorFullName.includes("/") &&
				!doctorFullName.includes("HNO") &&
				!doctorFullName.includes("MVZ") &&
				!doctorFullName.toLowerCase().includes("allgemeinarzt") &&
				!doctorFullName.toLowerCase().includes("allgemeinmedizin") &&
				!doctorFullName.toLowerCase().includes("augenarzt") &&
				!doctorFullName.toLowerCase().includes("augenärzt") &&
				!doctorFullName.toLowerCase().includes("augenheilkunde") &&
				!doctorFullName.toLowerCase().includes("gastroent") &&
				!doctorFullName.toLowerCase().includes("kinder") &&
				!doctorFullName.toLowerCase().includes("klinik") &&
				!doctorFullName.toLowerCase().includes("institut") &&
				!doctorFullName.toLowerCase().includes("medical") &&
				!doctorFullName.toLowerCase().includes("medizin") &&
				!doctorFullName.toLowerCase().includes("platz") &&
				!doctorFullName.toLowerCase().includes("praxis") &&
				!doctorFullName.toLowerCase().includes("psych") &&
				!doctorFullName.toLowerCase().includes("zentrum")) {
					let wordsInDoctorFullName = doctorFullName.split(" ");
					if (wordsInDoctorFullName.length > 1) {
						doctorGivenName = wordsInDoctorFullName[0];
						doctorFamilyName = wordsInDoctorFullName[wordsInDoctorFullName.length - 1];
					};	
			};
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
			};
			this.byId("email").setValue(emailAddress);

			if (!oDoctorFromOSM["contact:phone"] && oDoctorFromOSM["phone"]) {
				phoneNumber = oDoctorFromOSM["phone"];
			}
			else if (!oDoctorFromOSM["phone"] && oDoctorFromOSM["contact:phone"]) {
				phoneNumber = oDoctorFromOSM["contact:phone"];
			}
			else if (oDoctorFromOSM["contact:phone"] && oDoctorFromOSM["phone"]) {
				phoneNumber = oDoctorFromOSM["contact:phone"];
			};
			this.byId("phone").setValue(phoneNumber);
		}
	});
}, true);