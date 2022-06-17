sap.ui.define([
	'medunited/base/controller/AbstractMasterController',
	'medunited/care/utils/ScriptDownloader',
	'medunited/care/utils/BriefSender',
	'medunited/care/utils/BriefSender2',
	'medunited/care/utils/PharmacyNotifier',
	'sap/ui/model/xml/XMLModel'
], function (AbstractMasterController, ScriptDownloader, BriefSender, BriefSender2, PharmacyNotifier, XMLModel) {
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
			return oObject.name[0]?.given[0] + " " + oObject.name[0]?.family;
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
				alert("Sending Powershell Script. Functionality may be disabled");
				ScriptDownloader.makePowershellScript(this.getView(), selectedPlans);
			} else {
				// alert("Sending Brief");
				//BriefSender.sendEarztBrief(this.getView(), selectedPlans, this.eArztbriefModel);
				BriefSender2.sendEarztBrief(this.getView(), selectedPlans, this.eArztbriefModel);
			}
			PharmacyNotifier.notifyPharmacy(this.getView(), selectedPlans);
		},

		_buildMedicationRequests: function (selectedPlans) {

			const requestedOn = this._makeCurrentDateTime();

			const that = this;

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
									code: that.getView().getModel().getProperty(plan).identifier[0].value
								}
							]
						},
						subject: {
							reference: that.getView().getModel().getProperty(plan).subject.reference
						},
						performer: {
							reference: that.getView().getModel().getProperty(plan).informationSource.reference
						},
						dispenseRequest: {
							performer: that.getView().getModel().getProperty(plan)
						},
						authoredOn: requestedOn
					};

					const oFhirModel = that.getView().getModel();

					oFhirModel.create("MedicationRequest", medicationRequest, {
						success: function () {
							console.log("MedicationRequest created");
						},
						error: function (oError) {
							console.log(oError);
						}
					});
				}
			);

			//TODO: handle success and error
			this.getView().getModel().submitChanges();
		},

		_makeCurrentDateTime: function () {
			const today = new Date();
			const date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2);
			const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + "." + today.getMilliseconds() + "Z";
			return date + 'T' + time;
		}

	});
}, true);

