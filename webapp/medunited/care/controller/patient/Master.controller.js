sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
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
				var strCSV = e.target.result;
				var arrCSV = strCSV.match(/[\w .]+(?=,?)/g);
				var noOfCols = 3;

				// To ignore the first row which is header
				var hdrRow = arrCSV.splice(0, noOfCols);

				var data = [];
				while (arrCSV.length > 0) {
					var obj = {};
					// extract remaining rows one by one
					var row = arrCSV.splice(0, noOfCols)
					for (var i = 0; i < row.length; i++) {
						obj[hdrRow[i]] = row[i].trim()
					}
					// push row to an array
					data.push(obj)
				}
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
					template.birthDate = data[row]["PatientBirthdate"];
				};
				// Bind the data to the Table
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(data);
				var oTable = t.byId("patientTable");
				oTable.setModel(oModel);
			};
			reader.readAsBinaryString(file);

		}
	});
}, true);