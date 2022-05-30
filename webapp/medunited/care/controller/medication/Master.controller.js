sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'medunited/care/utils/ScriptDownloader',
	'medunited/care/utils/BriefSender'
], function (AbstractMasterController, ScriptDownloader, BriefSender) {
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
			//ScriptDownloader.makePowershellScript(this.getView());
			BriefSender.sendEarztBrief();
		}
	});
}, true);

