sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function (AbstractMasterController, Filter, FilterOperator) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.medication.Master", {
		getEntityName: function () {
			return "Medication";
		},
		groupOnSubject: function (oMedicationStatement) {
			try {
				const sPatientPath = oMedicationStatement.getProperty("subject").reference;
				return this.getNameForPath("/" + sPatientPath);
			} catch (e) {
				console.log(e);
				return "Patient unbekannt";
			}
		},
		getNameForPath: function (sObjectPath) {
			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty(sObjectPath);
			return oObject.name[0].given[0] + " " + oObject.name[0].family;
		},
		referencePhysician: function (sPractitionerPath) {
			try {
				if (sPractitionerPath) {
					return this.getNameForPath("/" + sPractitionerPath);
				}
			} catch (e) {
				console.log(e);
				return "Arzt unbekannt";
			}
		},
		onRequestEPrescriptions: function () {

			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty("/MedicationStatement");

			//create an empty array
			const medicationPlansT2Med = [];

			Object.values(oObject).forEach(val => {
				if ((val.hasOwnProperty("informationSource"))) {
					const practitionerId = val.informationSource.reference.split("/")[1];
					if (practitionerId == "56") {
						medicationPlansT2Med.push(val);
					}
				}
			});

			//extract the patient reference from the medication statement
			const medicationPlansT2MedPatient = medicationPlansT2Med.map(val => {
				return val.subject.reference.split("/")[1];
			});

			const name = oFhirModel.getProperty("/Patient/" + medicationPlansT2MedPatient[0] + "/name/0/given/0");
			const surname = oFhirModel.getProperty("/Patient/" + medicationPlansT2MedPatient[0] + "/name/0/family");

			fetch('resources/local/t2med.ps1')
				.then(response => response.blob())
				.then(blob => {
					const reader = new FileReader();
					reader.readAsText(blob);
					reader.onload = () => {
						const sText = reader.result;
						const sNewText = sText.replace("$patientName", name).replace("$patientSurname", surname);
						const newBlob = new Blob([sNewText], { type: "text/plain" });
						const sFileName = "t2med";
						const sFileType = "text/plain";
						const sFileExtension = "ps1";
						const sFile = new File([newBlob], sFileName, { type: sFileType });
						const oEvent = new MouseEvent("click", {
							view: window,
							bubbles: true,
							cancelable: true
						});
						const oLink = document.createElement("a");
						oLink.href = URL.createObjectURL(sFile);
						oLink.download = sFileName + "." + sFileExtension;
						oLink.dispatchEvent(oEvent);
					}
				})
		}
	});
}, true);

