sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'medunited/care/utils/ScriptDownloader',
	'medunited/care/utils/BriefSender',
	'sap/ui/model/xml/XMLModel'
], function (AbstractMasterController, ScriptDownloader, BriefSender, XMLModel) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.medication.Master", {

		onInit: function () {
			this.eArztbriefModel = new XMLModel("./medunited/template/Arztbrief-Minimal.XML");
		},

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
			BriefSender.sendEarztBrief(this.getView(), this.eArztbriefModel);
		}
	});
}, true);

