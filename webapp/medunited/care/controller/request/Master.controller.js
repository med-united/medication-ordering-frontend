sap.ui.define([
	"medunited/base/controller/AbstractMasterController"
], function (AbstractMasterController) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.request.Master", {

		getEntityName: function () {
			return "Request";
		},

		referencePatient: function (sPatientPath) {
			try {
				if (sPatientPath) {
					return this.getNameForPath("/" + sPatientPath);
				}
			} catch (e) {
				console.log(e);
			}
		},

		referencePractitioner: function (sPractitionerPath) {
			try {
				if (sPractitionerPath) {
					return this.getNameForPath("/" + sPractitionerPath);
				}
			} catch (e) {
				console.log(e);
			}
		},

		referencePharmacy: function (sPractitionerPath) {
			try {
				if (sPractitionerPath) {
					return this.getEmailForPath("/" + sPractitionerPath);
				}
			} catch (e) {
				console.log(e);
			}
		},

		getNameForPath: function (sObjectPath) {
			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty(sObjectPath);
			return oObject.name[0].given[0] + " " + oObject.name[0].family;
		},

		getEmailForPath: function (sObjectPath) {
			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty(sObjectPath);
			const pharmacyReference = oObject.managingOrganization.reference;
			const pharmacy = oFhirModel.getProperty("/" + pharmacyReference);
			return pharmacy.telecom[1].value;
		},

		

	});
}, true);

