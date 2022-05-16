sap.ui.define([
	"medunited/base/controller/AbstractMasterController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function (AbstractMasterController, Filter, FilterOperator) {
	"use strict";

	return AbstractMasterController.extend("medunited.care.controller.patient.Master", {
		getEntityName: function() {
			return "Patient";
		},
		getFilter: function(sQuery) {
			return [new Filter({
				filters: [
					new Filter("given", FilterOperator.Contains, sQuery),
					new Filter("family", FilterOperator.Contains, sQuery)
				],
				and: false
				}
			)];
		},
		getSortField: function() {
			return "family";
		},
		onPressCreatePatientFromBMP: function() {
			this.byId("extScanner").open();
		},
		onValueScanned: function(oEvent) {
			try {
				// <MP v="025" U="02BD2867FB024401A590D59D94E1FFAE" l="de-DE"><P g="Jürgen" f="Wernersen" b="19400324"/><A n="Praxis Dr. Michael Müller" s="Schloßstr. 22" z="10555" c="Berlin" p="030-1234567" e="dr.mueller@kbv-net.de" t="2018-07-01T12:00:00"/><S><M p="230272" m="1" du="1" r="Herz/Blutdruck"/><M p="2223945" m="1" du="1" r="Blutdruck"/><M p="558736" m="20" v="20" du="p" i="Wechseln der Injektionsstellen, unmittelbar vor einer Mahlzeit spritzen" r="Diabetes"/><M p="9900751" v="1" du="1" r="Blutfette"/></S><S t="zu besonderen Zeiten anzuwendende Medikamente"><M p="2239828" t="alle drei Tage 1" du="1" i="auf wechselnde Stellen aufkleben" r="Schmerzen"/></S><S c="418"><M p="2455874" m="1" du="1" r="Stimmung"/></S></MP>
				const sEMP = oEvent.getParameter("value")
				const parser = new DOMParser();
				const oEMP = parser.parseFromString(sEMP, "application/xml");

				const sBirthdate = oEMP.querySelector("P").getAttribute("b");
				// TODO: prevent duplicates
				const oPatient = {
					"name": [
						{
							"given": [oEMP.querySelector("P").getAttribute("g")],
							"family": oEMP.querySelector("P").getAttribute("f")
						}
					],
					"birthdate": sBirthdate.substring(0, 4)+"-"+sBirthdate.substring(4, 6)+"-"+sBirthdate.substring(6, 8)
				};

				const oModel = this.getView().getModel();
				const sPatientId = oModel.create(this.getEntityName(), oPatient, "patientDetails");

				const aMedication = Array.from(oEMP.querySelectorAll("M"));
				// https://www.vesta-gematik.de/standard/formhandler/324/gemSpec_Info_AMTS_V1_5_0.pdf
				for(let oMedication of aMedication) {
					let sPZN = oMedication.getAttribute("p");
					let sDosierschemaMorgens = oMedication.getAttribute("m");
					if(!sDosierschemaMorgens) {
						sDosierschemaMorgens = "0";
					}
					let sDosierschemaMittags = oMedication.getAttribute("d");
					if(!sDosierschemaMittags) {
						sDosierschemaMittags = "0";
					}
					let sDosierschemaAbends = oMedication.getAttribute("v");
					if(!sDosierschemaAbends) {
						sDosierschemaAbends = "0";
					}
					let sDosierschemaNachts = oMedication.getAttribute("h");
					if(!sDosierschemaNachts) {
						sDosierschemaNachts = "0";
					}
					// Dosiereinheit strukturiert
					let sDosage = oMedication.getAttribute("du");
					// reason
					let sReason = oMedication.getAttribute("r");
					let sAdditionalInformation = oMedication.getAttribute("i");
					this.getView().getModel().create("MedicationStatement", {
						identifier: [{"value": sPZN}],
						dosage: [
							{text: sDosierschemaMorgens+"-"+sDosierschemaMittags+"-"+sDosierschemaAbends+"-"+sDosierschemaNachts}
						],
						subject: {reference: "Patient/" + sPatientId}
					}, "patientDetails");
				}
				this.save();
			} catch(e) {
				console.log(e);
			}
		}
	});
}, true);