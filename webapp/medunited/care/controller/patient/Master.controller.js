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

			window.patientTemplate = this.getView().getModel("patient");
			window.medicationTemplate = this.getView().getModel("medicationStatement");
			window.practitionerTemplate = this.getView().getModel("practitioner");
			window.organizationTemplate = this.getView().getModel("organization");

			reader.onload = function (e) {
				let data = $.csv.toObjects(e.target.result);

				var patientTemplate = window.patientTemplate;
				var medicationTemplate = window.medicationTemplate;
				var practitionerTemplate = window.practitionerTemplate;
				var organizationTemplate = window.organizationTemplate;

				var bundle = {
					"resourceType": "Bundle",
					"type": "transaction",
					"entry": []
				}

				for (let row in data) {
					patientTemplate.setProperty("/name/0/given/0", data[row]["PatientGivenName"]);
					patientTemplate.setProperty("/name/0/family", data[row]["PatientFamilyName"]);
					patientTemplate.setProperty("/birthDate", data[row]["PatientBirthdate"]);
					medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/display", data[row]["MedicationName"]);
					medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/code",    data[row]["MedicationPZN"]);
					//medicationTemplate.setProperty("/medicationCodeableConcept/coding/0/display", data[row]["MedicationSize"]);
					medicationTemplate.setProperty("/dosage/0/text",          data[row]["MedicationDosage"]);
					practitionerTemplate.setProperty("/name/0/given/0",       data[row]["PractitionerGivenName"]);
					practitionerTemplate.setProperty("/name/0/family",        data[row]["PractitionerFamilyName"]);
					practitionerTemplate.setProperty("/address/0/line/0",     data[row]["PractitionerAddress"]);
					practitionerTemplate.setProperty("/address/0/postalCode", data[row]["PractitionerPostalCode"]);
					practitionerTemplate.setProperty("/address/0/city",       data[row]["PractitionerCity"]);
					practitionerTemplate.setProperty("/telecom/0/value",      data[row]["PractitionerPhone"]);
					practitionerTemplate.setProperty("/telecom/1/value",      data[row]["PractitionerEMail"]);
					organizationTemplate.setProperty("/name",                 data[row]["PharmacyName"]);
					organizationTemplate.setProperty("/address/0/line/0",     data[row]["PharmacyAddress"]);
					organizationTemplate.setProperty("/address/0/postalCode", data[row]["PharmacyPostalCode"]);
					organizationTemplate.setProperty("/address/0/city",       data[row]["PharmacyCity"]);
					organizationTemplate.setProperty("/telecom/0/value",      data[row]["PharmacyPhone"]);
					organizationTemplate.setProperty("/telecom/1/value",      data[row]["PharmacyEMail"]);
				};

				bundle.entry.push({
					"resource":patientTemplate.getData(),
					"request": {
						"method": "POST",
						"url": "Patient"
					}
				});
				bundle.entry.push({
					"resource":practitionerTemplate.getData(),
					"request": {
						"method": "POST",
						"url": "Practitioner"
					}
				});
				bundle.entry.push({
					"resource":medicationTemplate.getData(),
					"request": {
						"method": "POST",
						"url": "MedicationStatement"
					}
				});
				bundle.entry.push({
					"resource":organizationTemplate.getData(),
					"request": {
						"method": "POST",
						"url": "Organization"
					}
				});

				fetch('http://localhost:8080/fhir', {
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