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

				var patientTemplate = t.getView().getModel("patient");
				var medicationTemplate = t.getView().getModel("medicationStatement");
				var practitionerTemplate = t.getView().getModel("practitioner");
				var organizationTemplate = t.getView().getModel("organization");

				var bundle = {
					"resourceType": "Bundle",
					"type": "transaction",
					"entry": []
				}

				for (let row in data) {
					patientTemplate.setProperty("/name/0/given/0", data[row]["PatientGivenName"]);
					patientTemplate.setProperty("/name/0/family", data[row]["PatientFamilyName"]);
					patientTemplate.setProperty("/birthDate", data[row]["PatientBirthdate"]);
					bundle.entry.push({
						"resource": patientTemplate.getData(),
						"request": {
							"method": "POST",
							"url": "Patient"
						}
					});
					medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/display", data[row]["MedicationName"]);
					medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/code", data[row]["MedicationPZN"]);
					//medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/display", data[row]["MedicationSize"]);
					medicationTemplate.setProperty("/dosage/0/text", data[row]["MedicationDosage"]);
					bundle.entry.push({
						"resource": medicationTemplate.getData(),
						"request": {
							"method": "POST",
							"url": "MedicationStatement"
						}
					});
					practitionerTemplate.setProperty("/name/0/given/0", data[row]["PractitionerGivenName"]);
					practitionerTemplate.setProperty("/name/0/family", data[row]["PractitionerFamilyName"]);
					practitionerTemplate.setProperty("/address/0/line/0", data[row]["PractitionerAddress"]);
					practitionerTemplate.setProperty("/address/0/postalCode", data[row]["PractitionerPostalCode"]);
					practitionerTemplate.setProperty("/address/0/city", data[row]["PractitionerCity"]);
					practitionerTemplate.setProperty("/telecom/0/value", data[row]["PractitionerPhone"]);
					practitionerTemplate.setProperty("/telecom/1/value", data[row]["PractitionerEMail"]);
					bundle.entry.push({
						"resource": practitionerTemplate.getData(),
						"request": {
							"method": "POST",
							"url": "Practitioner"
						}
					});
					organizationTemplate.setProperty("/name", data[row]["PharmacyName"]);
					organizationTemplate.setProperty("/address/0/line/0", data[row]["PharmacyAddress"]);
					organizationTemplate.setProperty("/address/0/postalCode", data[row]["PharmacyPostalCode"]);
					organizationTemplate.setProperty("/address/0/city", data[row]["PharmacyCity"]);
					organizationTemplate.setProperty("/telecom/0/value", data[row]["PharmacyPhone"]);
					organizationTemplate.setProperty("/telecom/1/value", data[row]["PharmacyEMail"]);
					bundle.entry.push({
						"resource": organizationTemplate.getData(),
						"request": {
							"method": "POST",
							"url": "Organization"
						}
					});
				}

				fetch('http://localhost:8081/fhir', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + t.getOwnerComponent().jwtToken
					},
					body: JSON.stringify(bundle)
				});
			};
			reader.readAsBinaryString(file);
		},

		// onUploadFile: function () {
		// 	var fileUploader = this.getView().byId("idfileUploader");
		// 	var domRef = fileUploader.getFocusDomRef();
		// 	var file = domRef.files[0];

		// 	var reader = new FileReader();
		// 	var t = this;

		// 	reader.onload = function (e) {
		// 		let data = $.csv.toObjects(e.target.result);
		// 		let patientTemplate = t.getView().getModel("patient");
		// 		let medicationTemplate = t.getView().getModel("medicationStatement");
		// 		let practitionerTemplate = t.getView().getModel("practitioner");
		// 		let organizationTemplate = t.getView().getModel("organization");

		// 		let bundle = {
		// 			"resourceType": "Bundle",
		// 			"type": "transaction",
		// 			"entry": []
		// 		}

		// 		for (let dataRow of data) {
		// 			let resourceFound = false;
		// 			for (let bundleEntry of bundle.entry) {
		// 				resourceFound = bundleEntry.resource.resourceType === "Organization"
		// 					&& bundleEntry.resource.name === dataRow["PharmacyName"];
		// 				if (resourceFound) break;
		// 			}

		// 			if (!resourceFound) {
		// 				organizationTemplate.setProperty("/name", dataRow["PharmacyName"]);
		// 				organizationTemplate.setProperty("/address/0/line/0", dataRow["PharmacyAddress"]);
		// 				organizationTemplate.setProperty("/address/0/postalCode", dataRow["PharmacyPostalCode"]);
		// 				organizationTemplate.setProperty("/address/0/city", dataRow["PharmacyCity"]);
		// 				organizationTemplate.setProperty("/telecom/0/value", dataRow["PharmacyPhone"]);
		// 				organizationTemplate.setProperty("/telecom/1/value", dataRow["PharmacyEMail"]);

		// 				bundle.entry.push({
		// 					"resource": organizationTemplate.getData(),
		// 					"request": {
		// 						"method": "POST",
		// 						"url": "Organization"
		// 					}
		// 				});
		// 			}

		// 			resourceFound = false;
		// 			for (let bundleEntry of bundle.entry) {
		// 				resourceFound = bundleEntry.resource.resourceType === "Practitioner"
		// 					&& bundleEntry.resource.name[0].family === dataRow["PractitionerFamilyName"]
		// 					&& bundleEntry.resource.name[0].given[0] === dataRow["PractitionerGivenName"];
		// 				if (resourceFound) break;
		// 			}

		// 			if (!resourceFound) {
		// 				practitionerTemplate.setProperty("/name/0/family", dataRow["PractitionerFamilyName"]);
		// 				practitionerTemplate.setProperty("/name/0/given/0", dataRow["PractitionerGivenName"]);
		// 				practitionerTemplate.setProperty("/address/0/line/0", dataRow["PractitionerAddress"]);
		// 				practitionerTemplate.setProperty("/address/0/postalCode", dataRow["PractitionerPostalCode"]);
		// 				practitionerTemplate.setProperty("/address/0/city", dataRow["PractitionerCity"]);
		// 				practitionerTemplate.setProperty("/telecom/0/value", dataRow["PractitionerPhone"]);
		// 				practitionerTemplate.setProperty("/telecom/1/value", dataRow["PractitionerEMail"]);

		// 				bundle.entry.push({
		// 					"resource": practitionerTemplate.getData(),
		// 					"request": {
		// 						"method": "POST",
		// 						"url": "Practitioner"
		// 					}
		// 				});
		// 			}

		// 			patientTemplate.setProperty("/name/0/given/0", dataRow["PatientGivenName"]);
		// 			patientTemplate.setProperty("/name/0/family", dataRow["PatientFamilyName"]);
		// 			patientTemplate.setProperty("/birthDate", dataRow["PatientBirthdate"]);

		// 			bundle.entry.push({
		// 				"resource": patientTemplate.getData(),
		// 				"request": {
		// 					"method": "POST",
		// 					"url": "Patient"
		// 				}
		// 			});

		// 			medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/display", dataRow["MedicationName"]);
		// 			medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/code", dataRow["MedicationPZN"]);
		// 			//medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/display", dataRow["MedicationSize"]);
		// 			medicationTemplate.setProperty("/dosage/0/text", dataRow["MedicationDosage"]);

		// 			bundle.entry.push({
		// 				"resource": medicationTemplate.getData(),
		// 				"request": {
		// 					"method": "POST",
		// 					"url": "MedicationStatement"
		// 				}
		// 			});

		// 		};

		// 		fetch('http://localhost:8080/fhir', {
		// 			method: 'POST',
		// 			headers: {
		// 				'Accept': 'application/json',
		// 				'Content-Type': 'application/json',
		// 				'Authorization': 'Bearer ' + t.getOwnerComponent().jwtToken
		// 			},
		// 			body: JSON.stringify(bundle)
		// 		});
		// 	};
		// 	reader.readAsBinaryString(file);
		// }
	});
}, true);
