sap.ui.define([
    'medunited/care/lib/jquery-csv'
], function () {
    "use strict";
    return {
        processUploadedFile: function (oFile, oView) {
            return new Promise(function (resolve, reject) {
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
                        name:    oOrganisation.data.name,
                        address: oOrganisation.data.address[0].line
                    };
                    oOrganisation.id = JSON.stringify(oOrganisation.key);
                    return oOrganisation;
                };            
    
                const getPatient = function (oDataRow){
                    const oPatient = {};
                    oPatient.data = {
                        name: 
                            [{ use:    "official",
                               given: [oDataRow["PatientGivenName"]],
                               family: oDataRow["PatientFamilyName"] }],
                        birthDate: oDataRow["PatientBirthdate"],
                    };
                    oPatient.key = {
                        family:    oDataRow["PatientFamilyName"],
                        given:     oDataRow["PatientGivenName"],
                        birthdate: oDataRow["PatientBirthdate"]
                    };
                    oPatient.id = JSON.stringify(oPatient.key);
                    oPatient.setPatientId = function (sPatientId){
                        this.idInDB = sPatientId;
                    }
                    return oPatient;
                }
    
                const getMedicationStatement = function (oDataRow, sPatientId, sPractitionerId, sOrganisationId){
                    const oMedicationStatement = {};
                    oMedicationStatement.data = {
                        subject: { reference: "" },
                        informationSource: { reference: "" },
                        organisation: { reference: "" },
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
                        subject:  oMedicationStatement.data.subject.reference,
                        informationSource: oMedicationStatement.data.informationSource.reference,
                        medication: oMedicationStatement.data.medicationCodeableConcept.code.coding.code.value,
                        amount:     oMedicationStatement.data.medicationCodeableConcept.amount.numerator.value,
                    };
                    oMedicationStatement.setPatientReference = function (sPatientId){
                        this.data.subject.reference = "Patient/"+sPatientId;
                    };
                    oMedicationStatement.setPractitionerReference = function (sPractitionerId){
                        this.data.informationSource.reference = "Practitioner/"+sPractitionerId;
                    };
                    oMedicationStatement.setOrganisationReference = function (sOrganisationId){
                        this.data.organisation.reference = "Organisation/"+sOrganisationId;
                    };
                    oMedicationStatement.setPractitionerReference(sPractitionerId);
                    oMedicationStatement.setOrganisationReference(sOrganisationId);                
                    oMedicationStatement.setPatientReference(sPatientId);
                    oMedicationStatement.id = JSON.stringify(oMedicationStatement.key);
                    return oMedicationStatement;
                }
               
                // Create a File Reader object
                const oReader = new FileReader();
                oReader.onload = function (e) {
                    const oData = $.csv.toObjects(e.target.result);
                    const oBundle = {
                        patients:[],
                        practitioners:[],
                        organisations: [],
                        medicationStatements:[],
                    };
    
                    let isInBundle = false;
                    for (const oDataRow of oData) {
                        const oPatient = getPatient(oDataRow);
                        isInBundle = oBundle.patients.find(p=>p.id===oPatient.id);
                        if (!isInBundle) oBundle.patients.push(oPatient);
    
                        const oPractitioner = getPractitioner(oDataRow);
                        isInBundle = oBundle.practitioners.find(p=>p.id===oPractitioner.id);
                        if (!isInBundle) oBundle.practitioners.push(oPractitioner);
    
                        const oOrganisation = getOrganisation(oDataRow);
                        isInBundle = oBundle.organisations.find(p=>p.id===oOrganisation.id);
                        if (!isInBundle) oBundle.organisations.push(oOrganisation);
    
                        const oMedicationStatement = getMedicationStatement(oDataRow, oPatient.id, oOrganisation.id, oPractitioner.id);
                        isInBundle = oBundle.medicationStatements.find(p=>p.id===oMedicationStatement.id);
                        if (!isInBundle) oBundle.medicationStatements.push(oMedicationStatement);
                    };
    
                    const aRequests = [];
                    // DB existence check
                    for (let oPatient of oBundle.patients) {
                        const mParameters = {
                            urlParameters: oPatient.key,
                            success: function(oResponse){
                                if (oResponse.entry){
                                    const sPatientId = oResponse.entry[0].resource.id;
                                    oPatient.setPatientId(sPatientId);
                                } else {
                                    const transactionId = oModel.create("Patient", oPatient.data, "patientDetails");
                                }
                            },
                            error: function(oError){
                                console.log(oError.code, `${oError.message}\n${oError.additionalText}`);
                            }
                        };
                        aRequests.push(oModel.sendGetRequest('/Patient', mParameters).getRequest());
                    }
                    Promise.all(aRequests).then(() => {
                        oModel.submitChanges("patientDetails", (aFHIRResources) => {
                            for (let aFHIRResource of aFHIRResources){
                                for (let oPatient of oBundle.patients){
                                    if (!oPatient.idInDB && aFHIRResource.birthDate===oPatient.birthDate){
                                        oPatient.setPatientId(aFHIRResource.id);
                                    }
                                }
                            }
                            resolve(aFHIRResources);
                        }, function (oError) {
                            reject(oError);
                        });
                    });
                };
                oReader.readAsBinaryString(oFile);
            });

        }
    };

}, true);