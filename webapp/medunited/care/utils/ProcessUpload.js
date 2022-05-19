sap.ui.define([
    'medunited/care/lib/jquery-csv'
], function () {
    "use strict";
    return {
        processUploadedFile: function (oFile, oView) {
            const oModel = oView.getModel();

            const getPractitioner = function (oDataRow){
                const oPractitioner = {};
                oPractitioner.data = {
                    name: 
                        [{ given: [oDataRow["PractitionerGivenName"]],
                           family: oDataRow["PractitionerFamilyName"] }],
                    address:
                        [{ line: [oDataRow["PractitionerAddress"]],
                          postalCode: oDataRow["PractitionerPostalCode"],
                          city: oDataRow["PractitionerCity"],
                          country: "DE" }],
                    telecom:
                        [{ system: "phone", value: oDataRow["PractitionerPhone"], use: "work" },
                         { system: "email", value: oDataRow["PractitionerEMail"], use: "work" }]
                }
                oPractitioner.key = {
                    family: oPractitioner.data.name[0].family,
                    given:  oPractitioner.data.name[0].given[0]
                };
                oPractitioner.id = JSON.stringify(oPractitioner.key);
                return oPractitioner;
            };
          
            const getOrganisation = function (oDataRow){
                const oOrganisation = {};
                oOrganisation.data = {
                    name: oDataRow["PharmacyName"],
                    address: 
                        [{ line:      [oDataRow["PharmacyAddress"]],
                           postalCode: oDataRow["PharmacyPostalCode"],
                           city:       oDataRow["PharmacyCity"],
                           country:    "DE" }],
                    telecom: 
                        [{ system: "phone", value: oDataRow["PharmacyPhone"], use: "work" },
                         { system: "email", value: oDataRow["PharmacyEMail"], use: "work" }]
                }
                oOrganisation.key = {
                    name:    oOrganisation.data.name[0].family,
                    address: oOrganisation.data.address[0].line
                };
                oOrganisation.id = JSON.stringify(oOrganisation.key);
                return oOrganisation;
            };            

            const getPatient = function (oDataRow, sPractitionerId, sOrganisationId){
                const oPatient = {};
                oPatient.data = {
                    name: 
                        [{ use:    "official",
                           given: [oDataRow["PatientGivenName"]],
                           family: oDataRow["PatientFamilyName"] }],
                    birthdate: oDataRow["PatientBirthdate"],
                    extension: [
                        { practitioner: { reference: "" } },
                        { organisation: { reference: "" } }
                    ]
                };
                oPatient.key = {
                    family:    oDataRow["PatientFamilyName"],
                    given:     oDataRow["PatientGivenName"],
                    birthdate: oDataRow["PatientBirthdate"]
                };
                oPatient.setPractitionerReference = function (sPractitionerId){
                    this.data.extension[0].practitioner.reference = "Practitioner/"+sPractitionerId;
                };
                oPatient.setOrganisationReference = function (sOrganisationId){
                    this.data.extension[1].organisation.reference = "Organisation/"+sOrganisationId;
                };
                oPatient.setPractitionerReference(sPractitionerId);
                oPatient.setOrganisationReference(sOrganisationId);
                oPatient.id = JSON.stringify(oPatient.key);
                return oPatient;
            }

            const getMedicationStatement = function (oDataRow, sPatientId){
                const oMedicationStatement = {};
                oMedicationStatement.data = {
                    subject: { reference: "" },
                    status: "Active",
                    medicationCodeableConcept: {
                        code: {
                            coding: {
                               system: { value: "http://fhir.de/CodeSystem/ifa/pzn" },
                               code: { value: oDataRow["MedicationPZN"] }
                            },
                            text: { value: oDataRow["MedicationName"] }
                        },
                        amount: {
                            numerator: {
                                value: { value: oDataRow["MedicationSize"] },
                            }
                        }
                    },
                    dosage: [
                      { text: oDataRow["MedicationDosage"] }
                    ]
                };
                oMedicationStatement.key = {
                    reference:  oMedicationStatement.data.subject.reference,
                    medication: oMedicationStatement.data.medicationCodeableConcept.code.coding.code.value,
                    amount:     oMedicationStatement.data.medicationCodeableConcept.amount.numerator.value,
                };
                oMedicationStatement.setPatientReference = function (sPatientId){
                    this.data.subject.reference = "Patient/"+sPatientId;
                };
                oMedicationStatement.setPatientReference(sPatientId);
                oMedicationStatement.id = JSON.stringify(oMedicationStatement.key);
                return oMedicationStatement;
            }
           
            // Create a File Reader object
            const oReader = new FileReader();
            oReader.onload = function (e) {
                const oData = $.csv.toObjects(e.target.result);
                const oBundle = {
                    practitioners:[],
                    organisations: [],
                    patients:[],
                    medicationStatements:[],
                };

                let isInBundle = false;
                for (let oDataRow of oData) {

                    const oPractitioner = getPractitioner(oDataRow);
                    isInBundle = oBundle.practitioners.find(p=>p.id===oPractitioner.id);
                    if (!isInBundle) oBundle.practitioners.push(oPractitioner);

                    const oOrganisation = getOrganisation(oDataRow);
                    isInBundle = oBundle.organisations.find(p=>p.id===oOrganisation.id);
                    if (!isInBundle) oBundle.organisations.push(oOrganisation);

                    const oPatient = getPatient(oDataRow, oOrganisation.id, oPractitioner.id);
                    isInBundle = oBundle.patients.find(p=>p.id===oPatient.id);
                    if (!isInBundle) oBundle.patients.push(oPatient);

                    const oMedicationStatement = getMedicationStatement(oDataRow, oPatient.id);
                    isInBundle = oBundle.medicationStatements.find(p=>p.id===oMedicationStatement.id);
                    if (!isInBundle) oBundle.medicationStatements.push(oMedicationStatement);
                };
                return;
                // DB existence check
                let sPatientId=null;
                let oPatient = oBundle.patients[0];
                var mParameters = {
                    urlParameters: oPatient.key,
                    success: function(oBundle){
                        console.log(oBundle);
                    },
                    error: function(oError){
                        console.log(oError.code, oError.message);
                        sPatientId = oModel.create("Patient", oPatient.data, "patientDetails");
                    }
                };                    
                oModel.sendGetRequest('/Patient', mParameters);


                oModel.submitChanges();

                this.getView().getModel().create("MedicationStatement", {
                    identifier: [{"value": sPZN}],
                    dosage: [
                        {text: sDosierschemaMorgens+"-"+sDosierschemaMittags+"-"+sDosierschemaAbends+"-"+sDosierschemaNachts}
                    ],
                    subject: {reference: "Patient/" + sPatientId}
                }, "patientDetails");
                                        
            };
            oReader.readAsBinaryString(oFile);
        }
    };

}, true);