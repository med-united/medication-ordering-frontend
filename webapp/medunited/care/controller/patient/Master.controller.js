sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'medunited/care/libs/jquery-csv'
], function (AbstractMasterController, Filter, FilterOperator) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.patient.Master", {
		getEntityName: function () {
			return "Patient";
		},
		getFilter: function (sQuery) {
			return [new Filter({
				filters: [
					new Filter("given", FilterOperator.Contains, sQuery),
					new Filter("family", FilterOperator.Contains, sQuery)
				],
				and: false
			}
			)];
		},
		getSortField: function () {
			return "family";
		},

		onUploadFile: function () {
			var fU = this.getView().byId("idfileUploader");
			var domRef = fU.getFocusDomRef();
			var file = domRef.files[0];


			// Create a File Reader object
			var reader = new FileReader();
			var t = this;

			window.template = this.getView().getModel("patient");

			reader.onload = function (e) {
				let data = $.csv.toObjects(e.target.result);

				var template = window.template;

				var bundle = {
					"resourceType": "Bundle",
					"type": "transaction",
					"entry": []
				}

				var patientRequest = {
					"request": {
						"method": "POST",
						"url": "Patient"
					}
				}

				for (let row in data) {
					template.setProperty("/name/0/given/0", data[row]["PatientGivenName"]);
					template.setProperty("/name/0/family", data[row]["PatientFamilyName"]);
					template.setProperty("/birthDate", data[row]["PatientBirthdate"]);
				}

				bundle.entry.push(template.getData());
				bundle.entry.push(patientRequest);

				fetch('http://localhost:8081/fhir', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + window.jwtToken
					},
					body: JSON.stringify(bundle)
				});
			};
			reader.readAsBinaryString(file);

		}
	});
}, true);