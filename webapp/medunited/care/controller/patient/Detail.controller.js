sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/base/security/URLListValidator"
], function (AbstractDetailController, Formatter, MessageBox, Fragment, URLListValidator, MedicationSearchProvider) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.patient.Detail", {
		formatter: Formatter,
		getEntityName: function () {
			return "Patient";
		},
		getBindElementParams: function () {
			return {
				groupId: "patientDetails"
			};
		},
		formatPatientDataMatrix: function (sId) {
			const oPatient = this.getView().getModel().getProperty("/Patient/" + sId);
			const oMedicationStatement = this.getView().getModel().getProperty("/MedicationStatement");
			if (!oMedicationStatement) {
				return "";
			}
			const aMedicationStatementForPatient = Object.values(oMedicationStatement).filter(aMS => aMS.subject && aMS.subject.reference === "Patient/" + sId);
			return this.getMedicationPlanXml(oPatient, aMedicationStatementForPatient);
		},
		getMedicationPlanXml: function (oPatient, aMedicationStatementForPatient) {
			//https://update.kbv.de/ita-update/Verordnungen/Arzneimittel/BMP/EXT_ITA_VGEX_BMP_Anlage3_mitAend.pdf
			let sXML = "<MP xmlns=\"http://ws.gematik.de/fa/amtss/AMTS_Document/v1.6\" v=\"025\" U=\"" + [...Array(32)].map(() => 'ABCDEF0123456789'.charAt(Math.floor(Math.random() * 16))).join('') + "\" l=\"de-DE\">\n";
			if (oPatient && oPatient.name && oPatient.name.length > 0 && oPatient.name[0].given) {
				sXML += "  <P g=\"" + oPatient.name[0].given[0] + "\" f=\"" + oPatient.name[0].family + "\" b=\"" + (oPatient.birthDate ? oPatient.birthDate.replaceAll("-", "") : "") + "\" />\n";
			}
			sXML += "  <A n=\"med.united " + this.getNameFromLoggedPerson() + "\" s=\"" + this.getStreetFromLoggedPerson() + "\" z=\"" + this.getPostalCodeFromLoggedPerson() + "\" c=\"" + this.getCityFromLoggedPerson() + "\" p=\"" + this.getPhoneNumberFromLoggedPerson() + "\" e=\"" + this.getEmailFromLoggedPerson() + "\" t=\"" + new Date().toISOString().substring(0, 19) + "\" />\n";
			sXML += "  <S>\n";
			for (let oMedicationStatement of aMedicationStatementForPatient) {
				try {
					const pzn = oMedicationStatement.identifier[0].value
					sXML += "    <M p=\"" + pzn + "\" ";
					const medicationName = oMedicationStatement.medicationCodeableConcept.text;
					if (medicationName) {
						sXML += "a=\"" + medicationName + "\" ";
					}
					const oDosage = oMedicationStatement.dosage;
					if (oDosage) {
						const aDosage = oDosage[0].text.split(/-/);
						const mDosage = {
							0: "m",
							1: "d",
							2: "v",
							3: "h"
						};
						for (let i = 0; i < aDosage.length; i++) {
							sXML += mDosage[i] + "=\"" + aDosage[i] + "\" ";
						}
					}
					const sNote = oMedicationStatement.note;
					if (sNote) {
						const m = sNote.match("Grund: (.*) Hinweis: (.*)");
						if (m) {
							sXML += "r=\"" + m.group(1) + "\" i=\"" + m.group(2) + "\" ";
						} else {
							sXML += "i=\"" + sNote + "\" ";
						}
					}
					sXML += "/>\n";
				} catch (e) {
					console.error(e);
				}
			}
			sXML += "   </S>\n";
			sXML += "</MP>";
			return sXML;
		},

		getPhoneNumberFromLoggedPerson() {
			return this.getView().getModel("JWT").getProperty("/phone")
		},

		getNameFromLoggedPerson() {
			return this.getView().getModel("JWT").getProperty("/name")
		},

		getEmailFromLoggedPerson() {
			return this.getView().getModel("JWT").getProperty("/email")
		},

		getStreetFromLoggedPerson() {
			return this.getView().getModel("JWT").getProperty("/street")
		},

		getPostalCodeFromLoggedPerson() {
			return this.getView().getModel("JWT").getProperty("/postalCode")
		},

		getCityFromLoggedPerson() {
			return this.getView().getModel("JWT").getProperty("/city")
		},

		onCreateMedicationPlan: function () {
			const sPatientId = this._entity;
			fetch("https://medicationplan.med-united.health/medicationPlanPdf", {
				method: "POST",
				mode: "cors",
				body: this.formatPatientDataMatrix(sPatientId),
				headers: {
					"Accept": "application/pdf",
					"Content-Type": "application/xml"
				}
			})
				.then((oResponse) => {
					if (!oResponse.ok) {
						throw Error(oResponse.statusText);
					}
					return oResponse;
				})
				.then(oResponse => oResponse.blob())
				.then((oBlob) => {
					const sObjectURL = URL.createObjectURL(oBlob);
					if (!this.byId("medicationPlanDialog")) {
						URLListValidator.add("blob");
						// load asynchronous XML fragment
						Fragment.load({
							id: this.getView().getId(),
							name: "medunited.care.view." + this.getEntityName().toLowerCase() + ".MedicationPlanDialog",
							controller: this
						}).then((oDialog) => {
							// connect dialog to the root view of this component (models, lifecycle)
							this.getView().addDependent(oDialog);
							this._openMedicationPlanDialog(oDialog, sObjectURL);
						});
					} else {
						this._openMedicationPlanDialog(this.byId("medicationPlanDialog"), sObjectURL);
					}
				}).catch((oError) => MessageBox.show(this.translate("msgError", [oError])));
		},
		_openMedicationPlanDialog: function (oDialog, sObjectURL) {
			oDialog.open();
			this.byId("medicationPlanPdfViewer").setSource(sObjectURL);
		},
		onCloseMedicationPlan: function () {
			this.byId("medicationPlanDialog").close();
		}
	});
}, true);