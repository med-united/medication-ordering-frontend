sap.ui.define([
	'medunited/base/controller/AbstractMasterController',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'medunited/care/utils/ProcessUpload',
	'sap/m/MessageBox',
	'sap/m/MessageToast',
	"sap/ui/core/Fragment",
	"medunited/care/utils/DemoAccount"
], function (AbstractMasterController, Filter, FilterOperator, ProcessUpload, MessageBox, MessageToast, Fragment, DemoAccount) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.patient.Master", {

		onInit: function() {
			AbstractMasterController.prototype.onInit.apply(this, arguments);
			this._sSortField ="family"
		},

		getEntityName: function () {
			return "Patient";
		},
		getFilter: function (sQuery) {
			return [new Filter({
				filters: sQuery.match(".* .*") ?[
					// OR filter does not work
					new Filter("given", FilterOperator.Contains, sQuery.split(" ")[0]),
					new Filter("family", FilterOperator.Contains, sQuery.split(" ")[1])
				] : [
					// OR filter does not work
					//new Filter("given", FilterOperator.Contains, sQuery),
					new Filter("family", FilterOperator.Contains, sQuery)
				],
				and: false
			}
			)];
		},
		onSortFamilyName: function() {
			this._sSortField = "family";
			this.sort();
		},
		onSortBirthDate: function() {
			this._sSortField = "birthdate";
			this.sort();
		},
		getSortField: function () {
			return this._sSortField;
		},
		onImportPatientFromCSV: function () {
			var oView = this.getView();
			// create dialog lazily
			if (!this.byId("importCSVDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "medunited.care.view.patient.ImportCSVDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("importCSVDialog").open();
			}
		},
		onEncodingUTF8Selected: function (oEvent) {
			if (this.byId("iso88591").getSelected()) {
				this.byId("iso88591").setSelected(false);
			}
			else if (!this.byId("utf8").getSelected()) {
				this.byId("utf8").setSelected(true);
			}
		},
		onEncodingISO88591Selected: function (oEvent) {
			if (this.byId("utf8").getSelected()) {
				this.byId("utf8").setSelected(false);
			}
			else if (!this.byId("iso88591").getSelected()) {
				this.byId("iso88591").setSelected(true);
			}
		},
		onUploadCSVCancel: function () {
			this.byId("importCSVDialog").close();
		},
		onUploadCSVChange: function (oEvent) {
			this._fileUploaderFiles = oEvent.getParameter("files");
		},
		onUploadCSVFile: function () {
			if (DemoAccount._isDemoAccount(this.getView())) {
				return
			}
			let file = this._fileUploaderFiles[0];
			let encodingSelected;
			if (this.byId("utf8").getSelected()) {
				encodingSelected = "utf-8";
			}
			else if (this.byId("iso88591").getSelected()) {
				encodingSelected = "iso-8859-1";
			}
			const me = this;
			ProcessUpload.processUploadedFile(file, this.getView(), encodingSelected)
				.then((aResources) => {
					MessageToast.show(me.translate("msgCountCreated", aResources.length));
					me.byId("importCSVDialog").close();
				}, (oError) => {
					MessageBox.show(me.translate("msgPatientSavedFailed", [oError.statusCode, oError.statusText]));
				})
		},

		onPressCreatePatientFromBMP: function () {
			if (DemoAccount._isDemoAccount(this.getView())) {
				return
			}
			this.byId("extScanner").open();
		},
		referencePractitioner: function (sPractitionerPath) {
			try {
				if (sPractitionerPath) {
					return this.getNameForPath("/" + sPractitionerPath);
				}
			} catch (e) {
				console.log(e);
				return "Arzt unbekannt";
			}
		},
		getNameForPath: function (sObjectPath) {
			const oFhirModel = this.getView().getModel();
			const oObject = oFhirModel.getProperty(sObjectPath);
			if(!oObject || !oObject.name || !oObject.name[0] || !oObject.name[0].given) {
				return "";
			}
			return oObject.name[0].given[0] + " " + oObject.name[0].family;
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

		onValueScanned: function (oEvent) {

			const mPZN2Name = {};
			const sEMP = oEvent.getParameter("value")
			console.log(sEMP);
			const parser = new DOMParser();
			const oEMP = parser.parseFromString(sEMP, "application/xml");

			Promise.all(
				Array.from(oEMP.querySelectorAll("M"))
					.map(m => m.getAttribute("p"))
					.map(sPZN => fetch("https://medication.med-united.health/ajax/search/drugs/auto/?query=" + sPZN)
						.then(r => r.json())
						.then(oMedication => {
							console.log("ONE MEDICATION");
							console.log(oMedication.results.length);
							console.log(oMedication);
							console.log("---------------------------")
							if (oMedication.results.length > 0) {
								console.log("sPZN:");
								console.log(sPZN);
								console.log("oMedication:");
								console.log(oMedication);
								console.log("oEMP:");
								console.log(oEMP);
								mPZN2Name[sPZN] = oMedication.results[0].name;
							}
							else if (oMedication.results.length == 0) {
								console.log("zero results");
								console.log(oMedication.results.length);
								console.log(oEMP.querySelectorAll("W"));
								console.log(oEMP.querySelectorAll("W").length);
								for (const element of oEMP.querySelectorAll("W")) {
									console.log("inside for")
									console.log(element);
									console.log(element.getAttribute("w"))
									const fetchPromise = fetch("https://medication.med-united.health/ajax/search/drugs/auto/?query=" + element.getAttribute("w"))
									fetchPromise.then(response => response.json()).then(results => {
										mPZN2Name[sPZN] = this.cleanMedicationNameResults(results.results[0].name);
									});
								}
							}
							return true;
						})
					)).then(() => {
						console.log("inside then");
						this.createMedicationStatementWithNames(oEMP, mPZN2Name);
					});


		},
		cleanMedicationNameResults: function (medicationNameFromSearchProvider) {
            const htmlTagsRegex = /<\/?[^>]+>/g;
            return medicationNameFromSearchProvider.replace(htmlTagsRegex, '');
        },
		createMedicationStatementWithNames: function (oEMP, mPZN2Name) {
			try {
				// <MP v="025" U="02BD2867FB024401A590D59D94E1FFAE" l="de-DE"><P g="Jürgen" f="Wernersen" b="19400324"/><A n="Praxis Dr. Michael Müller" s="Schloßstr. 22" z="10555" c="Berlin" p="030-1234567" e="dr.mueller@kbv-net.de" t="2018-07-01T12:00:00"/><S><M p="230272" m="1" du="1" r="Herz/Blutdruck"/><M p="2223945" m="1" du="1" r="Blutdruck"/><M p="558736" m="20" v="20" du="p" i="Wechseln der Injektionsstellen, unmittelbar vor einer Mahlzeit spritzen" r="Diabetes"/><M p="9900751" v="1" du="1" r="Blutfette"/></S><S t="zu besonderen Zeiten anzuwendende Medikamente"><M p="2239828" t="alle drei Tage 1" du="1" i="auf wechselnde Stellen aufkleben" r="Schmerzen"/></S><S c="418"><M p="2455874" m="1" du="1" r="Stimmung"/></S></MP>
				const oModel = this.getView().getModel();

				// <A n="Praxis Dr. Michael Müller" s="Schloßstr. 22" z="10555" c="Berlin" p="030-1234567" e="dr.mueller@kbv-net.de" t="2018-07-01T12:00:00"/>
				const oPractitionerNode = oEMP.querySelector("A");
				const sBirthdate = oEMP.querySelector("P").getAttribute("b");

				const oPatient = {
					"name": [
						{
							"given": [oEMP.querySelector("P").getAttribute("g")],
							"family": oEMP.querySelector("P").getAttribute("f"),
							"use": "official"
						}
					],
					"birthDate": sBirthdate.substring(0, 4) + "-" + sBirthdate.substring(4, 6) + "-" + sBirthdate.substring(6, 8)
				};
				const oPractitioner = {};
				if (oPractitionerNode) {
					const sName = oPractitionerNode.getAttribute("n");
					if (sName && sName.split(/ /).length > 1) {
						const aNameParts = sName.split(/ /);
						oPractitioner.name = [
							{
								"given": [aNameParts[aNameParts.length - 2]],
								"family": aNameParts[aNameParts.length - 1],
								"use": "official"
							}
						];
						oPractitioner.address = [
							{
								"line": [oPractitionerNode.getAttribute("s")],
								"postalCode": oPractitionerNode.getAttribute("z"),
								"city": oPractitionerNode.getAttribute("c")
							}
						];
						oPractitioner.telecom = [];
						const sPhone = oPractitionerNode.getAttribute("p");
						if (sPhone) {
							oPractitioner.telecom.push({
								"system": "phone",
								"value": sPhone
							});
						}
						const sEmail = oPractitionerNode.getAttribute("e");
						if (sEmail) {
							oPractitioner.telecom.push({
								"system": "email",
								"value": sEmail
							});
						}
					}

					oModel.sendGetRequest("/Practitioner", {
						"urlParameters": {
							"family" : oPractitioner.name[0].family,
							"given" : oPractitioner.name[0].given[0]
						},
						"success" : () => {
							this.searchPatientResourcesFromMedicationPlan(oEMP, oModel, oPractitioner, oPatient, mPZN2Name);
						},
						"error" : (e) => {
							MessageBox.show(this.translate("msgSavedFailed", [e.code, e.message]));
							console.log(e.stack);
						}
					});
				} else {
					this.searchPatientResourcesFromMedicationPlan(oEMP, oModel, oPractitioner, oPatient, mPZN2Name);
				}
			} catch (e) {
				MessageBox.show(this.translate("msgSavedFailed", [e.code, e.message]));
				console.log(e.stack);
			}
		},
		searchPatientResourcesFromMedicationPlan : function (oEMP, oModel, oPractitioner, oPatient, mPZN2Name) {

			if(oPatient && oPatient.name && oPatient.name.length > 0 && oPatient.name[0].given) {
				oModel.sendGetRequest("/Patient", {
					"urlParameters": {
						"family" : oPatient.name[0].family,
						"given" : oPatient.name[0].given[0]
					},
					"success" : () => {
						this.createResourcesFromMedicationPlan(oEMP, oModel, oPractitioner, oPatient, mPZN2Name);
					},
					"error" : (e) => {
						MessageBox.show(this.translate("msgSavedFailed", [e.code, e.message]));
						console.log(e.stack);
					}
				});
			} else {
				this.createResourcesFromMedicationPlan(oEMP, oModel, oPractitioner, oPatient, mPZN2Name);
			}
		},
		createResourcesFromMedicationPlan: function (oEMP, oModel, oPractitioner, oPatient, mPZN2Name) {

			let sPractitionerId = undefined;
			let alreadyExistingPractitionerId = undefined;
			let alreadyExistingPatientId = undefined;

			//Check if practitioner already exists
			const aPractitioner = oModel.getProperty("/Practitioner") || [];
			if(Object.keys(oPractitioner).length > 0) {
				const existingDoctor = Object.values(aPractitioner).filter(a => a.name[0].family === oPractitioner.name[0].family && a.name[0].given[0] === oPractitioner.name[0].given[0])
				if (existingDoctor.length == 0) {
					sPractitionerId = oModel.create("Practitioner", oPractitioner, "patientDetails");
				} else {
					alreadyExistingPractitionerId = existingDoctor[0].id;
				}
			}

			if (sPractitionerId) {
				oPatient.generalPractitioner = {
					"reference": "urn:uuid:" + sPractitionerId
				}
			} else if (alreadyExistingPractitionerId) {
				oPatient.generalPractitioner = {
					"reference": "Practitioner/" + alreadyExistingPractitionerId
				}
			}
			//check if patient already exists
			let sPatientId = undefined;
			const existingPatient = Object.values(oModel.getProperty("/Patient")).filter(a => a.name[0].family === oPatient.name[0].family && a.name[0].given[0] === oPatient.name[0].given[0])
			if (existingPatient.length == 0) {
				sPatientId = oModel.create("Patient", oPatient, "patientDetails");
			} else {
				alreadyExistingPatientId = existingPatient[0].id;
			}
			this.createMedicationFromMedicationPlan(oEMP, oModel, sPractitionerId, alreadyExistingPractitionerId, sPatientId, alreadyExistingPatientId, mPZN2Name);
			this.save();
		},
		createMedicationFromMedicationPlan : function (oEMP, oModel, sPractitionerId, alreadyExistingPractitionerId, sPatientId, alreadyExistingPatientId, mPZN2Name) {
			const aMedication = Array.from(oEMP.querySelectorAll("M"));
			// https://www.vesta-gematik.de/standard/formhandler/324/gemSpec_Info_AMTS_V1_5_0.pdf
			for (let oMedication of aMedication) {
				let sPZN = oMedication.getAttribute("p");
				let sDosierschemaMorgens = oMedication.getAttribute("m");
				if (!sDosierschemaMorgens) {
					sDosierschemaMorgens = "0";
				}
				let sDosierschemaMittags = oMedication.getAttribute("d");
				if (!sDosierschemaMittags) {
					sDosierschemaMittags = "0";
				}
				let sDosierschemaAbends = oMedication.getAttribute("v");
				if (!sDosierschemaAbends) {
					sDosierschemaAbends = "0";
				}
				let sDosierschemaNachts = oMedication.getAttribute("h");
				if (!sDosierschemaNachts) {
					sDosierschemaNachts = "0";
				}
				// Dosiereinheit strukturiert
				let sDosage = oMedication.getAttribute("du");
				// reason
				let sReason = oMedication.getAttribute("r");
				let sAdditionalInformation = oMedication.getAttribute("i");

				const medicationName = mPZN2Name[sPZN];

				console.log("///////////////////////////");
				if (sPZN == null) {
					console.log("pzn is null");
					let fetchPromise = fetch("https://medication.med-united.health/ajax/search/drugs/auto/?query=" + medicationName)
					fetchPromise.then(response => response.json()).then(results => {
						sPZN = results.results[0].pzn;
						console.log("afterr");
						console.log(sPZN);
						let oMedicationStatement = undefined;

						if (sPatientId) {
							oMedicationStatement = {
								identifier: [{ "value": sPZN }],
								medicationCodeableConcept: { "text": medicationName },
								dosage: [
									{ text: sDosierschemaMorgens + "-" + sDosierschemaMittags + "-" + sDosierschemaAbends + "-" + sDosierschemaNachts }
								],
								subject: { "reference": "urn:uuid:" + sPatientId },
								note: "Grund: " + sReason + " Hinweis: " + sAdditionalInformation
							};
						} else if (alreadyExistingPatientId) {
							oMedicationStatement = {
								identifier: [{ "value": sPZN }],
								medicationCodeableConcept: { "text": medicationName },
								dosage: [
									{ text: sDosierschemaMorgens + "-" + sDosierschemaMittags + "-" + sDosierschemaAbends + "-" + sDosierschemaNachts }
								],
								subject: { "reference": "Patient/" + alreadyExistingPatientId },
								note: "Grund: " + sReason + " Hinweis: " + sAdditionalInformation
							};
						}

						if (sPractitionerId) {
							oMedicationStatement.informationSource = {
								reference: "urn:uuid:" + sPractitionerId
							};
						} else if (alreadyExistingPractitionerId) {
							oMedicationStatement.informationSource = {
								reference: "Practitioner/" + alreadyExistingPractitionerId
							};
						}
						oModel.create("MedicationStatement", oMedicationStatement, "patientDetails");
					});
				}
				else {   // TO BE REFACTORED
					let oMedicationStatement = undefined;

					if (sPatientId) {
						oMedicationStatement = {
							identifier: [{ "value": sPZN }],
							medicationCodeableConcept: { "text": medicationName },
							dosage: [
								{ text: sDosierschemaMorgens + "-" + sDosierschemaMittags + "-" + sDosierschemaAbends + "-" + sDosierschemaNachts }
							],
							subject: { "reference": "urn:uuid:" + sPatientId },
							note: "Grund: " + sReason + " Hinweis: " + sAdditionalInformation
						};
					} else if (alreadyExistingPatientId) {
						oMedicationStatement = {
							identifier: [{ "value": sPZN }],
							medicationCodeableConcept: { "text": medicationName },
							dosage: [
								{ text: sDosierschemaMorgens + "-" + sDosierschemaMittags + "-" + sDosierschemaAbends + "-" + sDosierschemaNachts }
							],
							subject: { "reference": "Patient/" + alreadyExistingPatientId },
							note: "Grund: " + sReason + " Hinweis: " + sAdditionalInformation
						};
					}

					if (sPractitionerId) {
						oMedicationStatement.informationSource = {
							reference: "urn:uuid:" + sPractitionerId
						};
					} else if (alreadyExistingPractitionerId) {
						oMedicationStatement.informationSource = {
							reference: "Practitioner/" + alreadyExistingPractitionerId
						};
					}
					oModel.create("MedicationStatement", oMedicationStatement, "patientDetails");
				}
			}
		}
	});
}, true);
