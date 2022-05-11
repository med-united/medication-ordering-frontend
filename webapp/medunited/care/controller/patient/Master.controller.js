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

			reader.onload = function (e) {
				let data = $.csv.toObjects(e.target.result);

				let template = {
					"resourceType": "Patient",
					"text": {
						"div": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>Sidharth ramesh</h1></div>",
						"status": "generated"
					},
					"name": [
						{
							"use": "official",
							"given": [
								"Sidhart"
							],
							"family": "Ramesh"
						}
					],
					"gender": "male",
					"birthDate": "1997-09-08",
					"telecom": [
						{
							"value": "98173981",
							"use": "mobile",
							"system": "phone"
						},
						{
							"system": "email",
							"value": "tornado@gmail.com"
						}
					]
				};
				for (let row in data) {
					template.name[0].given[0] = data[row]["PatientGivenName"];
					template.name[0].family = data[row]["PatientFamilyName"];
				}
				
				fetch('http://localhost:8081/fhir/Patient', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + window.jwtToken
					},
					body: JSON.stringify(template)
				});
			};
			reader.readAsBinaryString(file);

		}
	});
}, true);