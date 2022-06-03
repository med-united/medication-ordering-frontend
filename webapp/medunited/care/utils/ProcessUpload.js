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
                    oPractitioner.resource = {
                        resourceType: "Practitioner",
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
                    oPractitioner.getKey = () => {
                        return {
                            family: oPractitioner.resource.name[0].family,
                            given:  oPractitioner.resource.name[0].given[0],
                        };
                    };
                    oPractitioner.isTheSameAs = (resource) => {
                        return oPractitioner.resource.name[0].family   == resource.name[0].family
                            && oPractitioner.resource.name[0].given[0] == resource.name[0].given[0];
                    };

                    return oPractitioner;
                };
              
                const getOrganisation = function (oDataRow){
                    const oOrganisation = {};
                    oOrganisation.resource = {
                        resourceType: "Organisation",
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
                    oOrganisation.getKey = () => {
                        return {
                            name:    oOrganisation.resource.name,
                            address: oOrganisation.resource.address[0].line
                        };
                    };
                    oOrganisation.isTheSameAs = (resource) => {
                        return oOrganisation.resource.name            == resource.name
                            && oOrganisation.resource.address[0].line == resource.address[0].line;
                    };

                    return oOrganisation;
                };            
    
                const getPatient = function (oDataRow){
                    const oPatient = { };
                    oPatient.resource = {
                        resourceType: "Patient",
                        name: 
                            [{ use:   "official",
                               given: [oDataRow["PatientGivenName"]],
                               family: oDataRow["PatientFamilyName"] }],
                        birthDate: oDataRow["PatientBirthdate"],
                    };
                    oPatient.getKey = () => {
                        return {
                            family:    oPatient.resource.name[0].family,
                            given:     oPatient.resource.name[0].given[0],
                            birthdate: oPatient.resource.birthDate,
                        };
                    };
                    oPatient.isTheSameAs = (resource) => {
                        return oPatient.resource.name[0].family   == resource.name[0].family
                            && oPatient.resource.name[0].given[0] == resource.name[0].given[0]
                            && oPatient.resource.birthDate        == resource.birthDate;
                    };

                    return oPatient;
                }
    
                const getMedicationStatement = function (oDataRow, oPatientResource, oPractitionerResource, oOrganisationResource){
                    const oMedicationStatement = {};
                    oMedicationStatement.resource = {
                        resourceType: "MedicationStatement",
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
                    oMedicationStatement.getKey = () => {
                        return {
                            subject:           oMedicationStatement.resource.subject.reference,
                            informationSource: oMedicationStatement.resource.informationSource.reference,
                            medication:        oMedicationStatement.resource.medicationCodeableConcept.code.coding.code.value,
                            amount:            oMedicationStatement.resource.medicationCodeableConcept.amount.numerator.value,
                        };
                    };
                    oMedicationStatement.isTheSameAs = (resource) => {
                        return oMedicationStatement.resource.subject.reference                                == resource.subject.reference
                            && oMedicationStatement.resource.informationSource.reference                      == resource.informationSource.reference
                            && oMedicationStatement.resource.medicationCodeableConcept.code.coding.code.value == resource.medicationCodeableConcept.code.coding.code.value
                            && oMedicationStatement.resource.medicationCodeableConcept.amount.numerator.value == resource.medicationCodeableConcept.amount.numerator.value;
                    };                    
                    oMedicationStatement.setPatientReference = (oReferredResource) => {
                        oMedicationStatement.resource.subject.reference = oReferredResource.resourceType+"/"+oReferredResource.id;
                    };
                    oMedicationStatement.setPractitionerReference = (oReferredResource) => {
                        oMedicationStatement.resource.informationSource.reference = oReferredResource.resourceType+"/"+oReferredResource.id;
                    };
                    oMedicationStatement.setOrganisationReference = (oReferredResource) => {
                        oMedicationStatement.resource.organisation.reference = oReferredResource.resourceType+"/"+oReferredResource.id;
                    };
                    oMedicationStatement.setPatientReference(oPatientResource);
                    oMedicationStatement.setPractitionerReference(oPractitionerResource);
                    oMedicationStatement.setOrganisationReference(oOrganisationResource);                

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
                        isInBundle = oBundle.patients.find(p=>oPatient.isTheSameAs(p.resource));
                        if (!isInBundle) oBundle.patients.push(oPatient);
    
                        const oPractitioner = getPractitioner(oDataRow);
                        isInBundle = oBundle.practitioners.find(p=>oPractitioner.isTheSameAs(p.resource));
                        if (!isInBundle) oBundle.practitioners.push(oPractitioner);
    
                        const oOrganisation = getOrganisation(oDataRow);
                        isInBundle = oBundle.organisations.find(p=>oOrganisation.isTheSameAs(p.resource));
                        if (!isInBundle) oBundle.organisations.push(oOrganisation);
    
                        const oMedicationStatement = getMedicationStatement(oDataRow, oPatient.resource, oOrganisation.resource, oPractitioner.resource);
                        isInBundle = oBundle.medicationStatements.find(p=>oMedicationStatement.isTheSameAs(p.resource));
                        if (!isInBundle) oBundle.medicationStatements.push(oMedicationStatement);
                    };
    
                    const aRequests = [];
                    // DB existence check
                    for (let oPatient of oBundle.patients) {
                        const mParameters = {
                            urlParameters: oPatient.getKey(),
                            success: function(oResponse){
                                if (oResponse.entry){
                                    oPatient.id = oResponse.entry[0].resource.id;
                                } else {
                                    const transactionId = oModel.create(oPatient.resource.resourceType, oPatient.resource, "patientDetails");
                                }
                            },
                            error: function(oError){
                                console.log(oError.code, `${oError.message}\n${oError.additionalText}`);
                            }
                        };
                        aRequests.push(oModel.sendGetRequest('/'+oPatient.resource.resourceType, mParameters).getRequest());
                    }

                    Promise.all(aRequests)
                    .then( () => {
                        oModel.submitChanges("patientDetails", (aFHIRResources) => {
                            for (let oPatient of oBundle.patients){
                                if (!oPatient.id){
                                    for (let aFHIRResource of aFHIRResources){
                                        if (oPatient.isTheSameAs(aFHIRResource)){
                                            oPatient.id = aFHIRResource.id;
                                            break;
                                        }
                                    }
                                }
                            }
                            resolve(aFHIRResources);
                        }, (oError) => {
                            reject(oError);
                        });
                    });
                };
                oReader.readAsBinaryString(oFile);
            });

        }
    };

}, true);
