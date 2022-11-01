sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
    "sap/ui/model/ChangeReason"
], function (AbstractMasterController, ChangeReason) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.request.Master", {

		getEntityName: function () {
			return "Request";
		},

		referencePatient: function (sPatientPath) {
			try {
				if (sPatientPath) {
					return this.getNameForPath("/" + sPatientPath, true);
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

		getNameForPath: function (sObjectPath, bBirthday) {
			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty(sObjectPath);
			if(!oObject || !oObject.name || !oObject.name[0] || !oObject.name[0].given) {
				return "";
			}
			return oObject.name[0].given[0] + " " + oObject.name[0].family +(bBirthday ? " "+oObject.birthDate : "");
		},

		getEmailForPath: function (sObjectPath) {
			const oFhirModel = this.getView().getModel();
			const pharmacy = oFhirModel.getProperty(sObjectPath);
			return pharmacy && pharmacy.telecom.length > 0 && pharmacy.telecom[1].value ? pharmacy.telecom[1].value : "";
		},

		onDataReceivedReceiveMissingPharmacies: function(oEvent) {
			const oData = oEvent.getParameter("data");
			const oModel = this.getView().getModel();
			const mMissingOrganizations = {};
			if(!oData.entry || oData.entry.length == 0) {
				return;
			}
			for(let oMedicationRequest of oData.entry) {
				if(!oMedicationRequest.resource.extension || oMedicationRequest.resource.extension.length < 2) {
					continue;
				}
				let oOrganizationReference = oMedicationRequest.resource.extension[1].valueString;
				if(!oModel.getProperty("/"+oOrganizationReference)) {
					mMissingOrganizations[oOrganizationReference] = true;
				}
			}
			if(Object.keys(mMissingOrganizations).length > 0) {
				oModel.sendGetRequest("/Organization", {
					"urlParameters": {
						"_id" : Object.keys(mMissingOrganizations).map((s) => s.split("/")[1]).join(",")
					},
					"success": () => {
						this.getView().byId("requestTable").getBinding("items")._fireChange({
							reason: ChangeReason.Change
						});
					}
				});
			}
		}		

	});
}, true);

