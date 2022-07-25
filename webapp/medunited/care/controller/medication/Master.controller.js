sap.ui.define([
	'medunited/base/controller/AbstractMasterController',
	'medunited/care/utils/ScriptDownloader',
	'medunited/care/utils/BriefSender',
	'medunited/care/utils/PharmacyNotifier',
	'sap/ui/model/xml/XMLModel',
	'medunited/care/utils/DemoAccount'
], function (AbstractMasterController, ScriptDownloader, BriefSender, PharmacyNotifier, XMLModel, DemoAccount) {
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

			if(DemoAccount._isDemoAccount(this.getView())) {
				return
			}

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

			// structure = { Practitioner : { Patient : [ MedicationStatements ]}}
			const structure = this._populateStructure(selectedPlans);

			if (prescriptionInterface === "t2med") {
				alert("Sending Powershell Script. Functionality may be disabled");
				ScriptDownloader.makePowershellScript(this.getView(), selectedPlans);
			}
			else if (prescriptionInterface === "isynet") {
				console.log("isynet");
				let listOfBundles = this._createBundles(structure);
				console.log(listOfBundles);
			}
			else {
				alert("Sending Brief");
				BriefSender.sendEarztBrief(this.getView(), structure, this.eArztbriefModel);
			}
			// PharmacyNotifier.notifyPharmacy(this.getView(), selectedPlans);
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
			const time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" + ("0" + today.getSeconds()).slice(-2) + "." + ("0" + today.getMilliseconds()).slice(-2) + "Z";
			return date + 'T' + time;
		},

		_createBundles: function(structure) {

			// one bundle per Practitioner
			let listOfBundles = [];

			// builds the Bundle
			for (const practitioner of Object.entries(structure)) {
				const patientsOfPractitioner = practitioner[1];
				let newBundle = "";
				newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty('/' + practitioner[0])) + "},";
				for (let j = 0; j < Object.entries(patientsOfPractitioner).length; j++) {
					const patient = Object.entries(patientsOfPractitioner)[j][0];
					newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty('/' + patient)) + "},";
					const medicationStatementsOfPatient = Object.entries(patientsOfPractitioner)[j][1];

					for (let i = 0; i < medicationStatementsOfPatient.length; i++) {
						let medStatement = medicationStatementsOfPatient[i];
						newBundle += "{\"fullUrl\": \"\",\"resource\": " + JSON.stringify(this.getView().getModel().getProperty(medStatement)) + "}";
						if (i < medicationStatementsOfPatient.length-1) {
							newBundle+= ",";
						}
					}
					if (j < Object.entries(patientsOfPractitioner).length-1) {
						newBundle+= ",";
					}
				}
				newBundle = "\"entry\" : [" + newBundle + "]";
				newBundle = "{\"resourceType\": \"Bundle\",	\"id\": \"\", \"meta\": { \"lastUpdated\": \"\", \"profile\": [	\"https://fhir.kbv.de/StructureDefinition/KBV_PR_ERP_Bundle|1.0.2\"	]},	\"identifier\": { \"system\": \"https://gematik.de/fhir/NamingSystem/PrescriptionID\", \"value\": \"\"}, \"type\": \"document\",\"timestamp\": \"" + this._makeCurrentDateTime() + "\"," + newBundle + "}";
				listOfBundles.push(newBundle);
			}

			return listOfBundles;
		},

		_populateStructure: function(selectedPlans) {

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

