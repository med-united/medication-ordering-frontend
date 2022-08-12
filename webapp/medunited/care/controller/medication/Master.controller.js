sap.ui.define([
	'medunited/base/controller/AbstractMasterController',
	'medunited/care/utils/ScriptDownloader',
	'medunited/care/utils/BriefSender',
	'medunited/care/websocket/StompPrescriptionSender',
	'medunited/care/utils/PharmacyNotifier',
	'sap/ui/model/xml/XMLModel',
	'medunited/care/utils/DemoAccount',
	'sap/m/MessageBox'
], function (AbstractMasterController, ScriptDownloader, BriefSender, StompPrescriptionSender, PharmacyNotifier, XMLModel, DemoAccount, MessageBox) {
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

		referenceOrganization: function (sOrganizationPath) {
			try {
				if (sOrganizationPath) {
					return this.getPharmacyNameForPath("/" + sOrganizationPath);
				}
			} catch (e) {
				console.log(e);
				return "Apotheke unbekannt";
			}
		},

		getPharmacyNameForPath: function (sObjectPath) {
			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty(sObjectPath);
			return oObject.name;
		},

		onRequestEPrescriptions: function () {

			if (DemoAccount._isDemoAccount(this.getView())) {
				return
			}
			const medicationTableEntity = this.getEntityName().toLowerCase() + "Table";
			const selectedPlans = this.byId(medicationTableEntity).getSelectedItems()
				.map(
					oItem =>
						oItem.getBindingContext().getPath());

			let practitionerAndPharmacyAreDefinedForAllSelectedPlans = this._practitionerAndPharmacyAreDefinedForAllSelectedPlans(selectedPlans);

			if (practitionerAndPharmacyAreDefinedForAllSelectedPlans) {
				this._buildMedicationRequests(selectedPlans);
				this._requestPrescriptionsAccordingToPrescriptionInterface(selectedPlans);
			} else {
				return;
			}
		},

		_requestPrescriptionsAccordingToPrescriptionInterface: function (selectedPlans) {

			let prescriptionsRequestedUsing_t2med = [];
			let prescriptionsRequestedUsing_isynet = [];
			let prescriptionsRequestedUsing_email = [];

			for (const plan of selectedPlans) {
				const practitioner = this.getView().getModel().getProperty(plan).informationSource.reference
				const prescriptionInterface = this.getView().getModel().getProperty("/" + practitioner).extension[0].valueString
				switch (prescriptionInterface) {
					case "t2med":
						prescriptionsRequestedUsing_t2med.push(plan);
						break;
					case "isynet":
						prescriptionsRequestedUsing_isynet.push(plan);
						break;
					case "e-mail":
						prescriptionsRequestedUsing_email.push(plan);
				}
			}

			if (prescriptionsRequestedUsing_t2med.length > 0) {
				alert("Sending Powershell Script. Functionality may be disabled");
				ScriptDownloader.makePowershellScript(this.getView(), prescriptionsRequestedUsing_t2med);
			}
			if (prescriptionsRequestedUsing_isynet.length > 0) {
				let listOfBundles = this._createBundles(prescriptionsRequestedUsing_isynet);
				console.log(listOfBundles);
				StompPrescriptionSender.sendFHIRBundlesToBroker(listOfBundles);
			}
			if (prescriptionsRequestedUsing_email.length > 0) {
				alert("Sending Brief");
				// structure = { Practitioner : { Patient : [ MedicationStatements ]}}
				const structure = this._populateStructure(prescriptionsRequestedUsing_email);
				// BriefSender.sendEarztBrief(this.getView(), structure, this.eArztbriefModel);
			}
			// PharmacyNotifier.notifyPharmacy(this.getView(), selectedPlans);
		},

		_practitionerAndPharmacyAreDefinedForAllSelectedPlans(selectedPlans) {
			for (const medicationStatement of selectedPlans) {
				const practitioner = this.getView().getModel().getProperty(medicationStatement + '/informationSource/reference');
				const organization = this.getView().getModel().getProperty(medicationStatement + '/derivedFrom/0/reference');
				if (organization === undefined || practitioner === undefined) {
					MessageBox.warning(this.translate("msgAtLeastOneOfThePrescriptionsIsNotAssignedToADoctorOrAPharmacy") + "\n\n" + this.translate("msgPleaseSelectTheseInTheDetailsViewOfThePatient"), {title: this.translate("msgBeforeProceeding")});	
					return false;
				}
			}
			return true;
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
							"quantity": {
								"value": "",
								// "value": that.getView().getModel().getProperty(plan).extension[0].valueString,
								"system": "http://unitsofmeasure.org",
								"code": ""
								// "code": that.getView().getModel().getProperty(plan).extension[1].valueString
							}
						},
						authoredOn: requestedOn,
						extension: [{
							valueString: that.getView().getModel().getProperty(plan).medicationCodeableConcept.text
						}],
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
			const time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" + ("0" + today.getSeconds()).slice(-2) + "." + ("0" + today.getMilliseconds()).slice(-2) + "Z";
			return date + 'T' + time;
		},

		_createBundles: function (selectedPlans) {
			// one bundle per MedicationStatement
			let listOfBundles = [];

			// Bundle has Practitioner + Patient + MedicationStatement + Organization
			for (const medicationStatement of selectedPlans) {
				let newBundle = "";
				const practitioner = this.getView().getModel().getProperty(medicationStatement + '/informationSource/reference');
				newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty('/' + practitioner)) + "},";
				const patient = this.getView().getModel().getProperty(medicationStatement + '/subject/reference');
				newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty('/' + patient)) + "},";
				newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty(medicationStatement)) + "},";
				const organization = this.getView().getModel().getProperty(medicationStatement + '/derivedFrom/0/reference');
				newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty('/' + organization)) + "}";
				newBundle = "\"entry\" : [" + newBundle + "]";
				newBundle = "{\"resourceType\": \"Bundle\",	\"id\": \"\", \"meta\": { \"lastUpdated\": \"\", \"profile\": [	\"https://fhir.kbv.de/StructureDefinition/KBV_PR_ERP_Bundle|1.0.2\"	]},	\"identifier\": { \"system\": \"https://gematik.de/fhir/NamingSystem/PrescriptionID\", \"value\": \"\"}, \"type\": \"document\",\"timestamp\": \"" + this._makeCurrentDateTime() + "\"," + newBundle + "}";
				listOfBundles.push(newBundle);
			}
			return listOfBundles;
		},

		_populateStructure: function (selectedPlans) {

			// structure = { Practitioner : { Patient : [ MedicationStatements ]}}
			const structure = {};

			for (const plan of selectedPlans) {
				const patient = this.getView().getModel().getProperty(plan + '/subject/reference');
				const practitioner = this.getView().getModel().getProperty(plan + '/informationSource/reference');
				if (practitioner in structure) {
					if (patient in structure[practitioner]) {
						structure[practitioner][patient].push(plan);
					}
					else {
						structure[practitioner][patient] = [];
						structure[practitioner][patient].push(plan);
					}
				}
				else {
					structure[practitioner] = {};
					structure[practitioner][patient] = [];
					structure[practitioner][patient].push(plan);
				}
			}
			return structure;
		}

	});
}, true);

