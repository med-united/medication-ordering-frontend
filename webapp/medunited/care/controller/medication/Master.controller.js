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
			}
		},

		onRequestEPrescriptions: function () {

			const medicationTableEntity = this.getEntityName().toLowerCase() + "Table";
			const selectedPlans = this.byId(medicationTableEntity).getSelectedItems()
				.map(
					oItem =>
						oItem.getBindingContext().getPath());

			const practitioner = this.getView().getModel().getProperty(selectedPlans[0]).informationSource.reference
			const prescriptionInterface = this.getView().getModel().getProperty("/" + practitioner).extension[0].valueString

			this._buildMedicationRequests(selectedPlans);

			this._requestPrescriptionsAccordingTo(prescriptionInterface, selectedPlans);
		},

		_requestPrescriptionsAccordingTo: function (prescriptionInterface, selectedPlans) {
			if (prescriptionInterface === "t2med") {
				alert("Sending to T2MED");
				//ScriptDownloader.makePowershellScript(this.getView(), selectedPlans);
			} else {
				alert("Sending Brief");
				// BriefSender.sendEarztBrief(this.getView(), selectedPlans, this.eArztbriefModel);
			}
		},

		_buildMedicationRequests: function (selectedPlans) {
			selectedPlans.forEach(
				plan => {
					const medicationRequest = {
						resourceType: "MedicationRequest",
						status: "active",
						intent: "order",
						medicationCodeableConcept: {
							coding: [
								{
									system: "http://www.nlm.nih.gov/research/umls/rxnorm",
									code: this.getView().getModel().getProperty(plan).identifier[0].value
								}
							]
						},
						subject: {
							reference: this.getView().getModel().getProperty(plan).subject.reference
						}
					};

					const oFhirModel = this.getView().getModel();
					oFhirModel.create("MedicationRequest", medicationRequest, {
						success: function () {
							console.log("MedicationRequest created");
						},
						error: function (oError) {
							console.log(oError);
						}
					});

					this.getView().getModel().submitChanges();
				}
			);
		}

	});
}, true);

