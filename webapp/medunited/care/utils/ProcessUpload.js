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
              
                const getOrganization = function (oDataRow){
                    const oOrganization = {};
                    oOrganization.resource = {
                        resourceType: "Organization",
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
                    oOrganization.getKey = () => {
                        return {
                            name:    oOrganization.resource.name,
                            address: oOrganization.resource.address[0].line
                        };
                    };
                    oOrganization.isTheSameAs = (resource) => {
                        return oOrganization.resource.name               == resource.name
                            && oOrganization.resource.address[0].line[0] == resource.address[0].line[0];
                    };

                    return oOrganization;
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
    
                const getMedicationStatement = function (oDataRow, oPatient, oPractitioner, oOrganization){
                    const oMedicationStatement = {};
                    oMedicationStatement.resource = {
                        resourceType: "MedicationStatement",
                        identifier: [],
                        subject: { reference: "" },
                        informationSource: { reference: "" },
                        organization: { reference: "" },
                        medicationCodeableConcept: {
                            text: oDataRow["MedicationName"]
                        },
                        extension: [
                            { valueString: oDataRow["MedicationAmount"] ? oDataRow["MedicationAmount"] : "1" },
                            { valueString: oDataRow["MedicationSize"] }
                        ],
                        dosage: [
                          { text: oDataRow["MedicationDosage"] }
                        ],
                        note: [
                            {text: oDataRow["MedicationNote"] }
                        ]
                    };
                    if(oDataRow["MedicationPZN"]) {
                        oMedicationStatement.resource.identifier.push({"value": oDataRow["MedicationPZN"]})
                    }
                    oMedicationStatement.getKey = () => {
                        return {
                            subject:           oMedicationStatement.resource.subject.reference,
                            informationSource: oMedicationStatement.resource.informationSource.reference,
                            medication:        oMedicationStatement.resource.identifier && oMedicationStatement.resource.identifier.length > 0 && oMedicationStatement.resource.identifier[0].value,
                            patient:           oMedicationStatement.resource.subject.reference,
                        };
                    };
                    oMedicationStatement.isTheSameAs = (resource) => {
                        return oMedicationStatement.resource.subject.reference                                == resource.subject.reference
                            && oMedicationStatement.resource.informationSource.reference                      == resource.informationSource.reference
                            && oMedicationStatement.resource.identifier
                            && oMedicationStatement.resource.identifier.length > 0
                            && resource.identifier
                            && resource.identifier.length > 0
                            && oMedicationStatement.resource.identifier[0].value == resource.identifier[0].value;
                    };
                    oMedicationStatement.setPatientReference = () => {
                        oMedicationStatement.resource.subject.reference = oPatient.resource.resourceType+"/"+oPatient.id;
                    };
                    oMedicationStatement.setPractitionerReference = () => {
                        oMedicationStatement.resource.informationSource.reference = oPractitioner.resource.resourceType+"/"+oPractitioner.id;
                    };
                    oMedicationStatement.setOrganizationReference = () => {
                        oMedicationStatement.resource.derivedFrom = [{reference : oOrganization.resource.resourceType+"/"+oOrganization.id}];
                    };
                    return oMedicationStatement;
                }
               
                // Create a File Reader object
                const oReader = new FileReader();
                oReader.onload = function (e) {
                    const oData = $.csv.toObjects(e.target.result);
                    const oBundle = {
                        patients:[],
                        practitioners:[],
                        organizations: [],
                        medicationStatements:[],
                    };

                    // collect unique resources from rows
                    let foundObj = null;
                    for (const oDataRow of oData) {
                        let oPatient = getPatient(oDataRow);
                        foundObj = oBundle.patients.find(p=>oPatient.isTheSameAs(p.resource));
                        if (foundObj) oPatient = foundObj;
                        else oBundle.patients.push(oPatient);
    
                        let oPractitioner = getPractitioner(oDataRow);
                        foundObj = oBundle.practitioners.find(p=>oPractitioner.isTheSameAs(p.resource));
                        if (foundObj) oPractitioner = foundObj;
                        else oBundle.practitioners.push(oPractitioner);
    
                        let oOrganization = getOrganization(oDataRow);
                        foundObj = oBundle.organizations.find(p=>oOrganization.isTheSameAs(p.resource));
                        if (foundObj) oOrganization = foundObj;
                        else oBundle.organizations.push(oOrganization);
    
                        const oMedicationStatement = getMedicationStatement(oDataRow, oPatient, oPractitioner, oOrganization);
                        foundObj = oBundle.medicationStatements.find(p=>oMedicationStatement.isTheSameAs(p.resource));
                        if (!foundObj) oBundle.medicationStatements.push(oMedicationStatement);
                    };
    
                    // DB existence check
                    const transactionGroup = "patientDetails"
                    const aGetRequests = [];
                    [...oBundle.patients, ...oBundle.practitioners, ...oBundle.organizations].forEach(oCSVResource => {
                        aGetRequests.push(oModel.sendGetRequest('/'+oCSVResource.resource.resourceType, {
                            urlParameters: oCSVResource.getKey(),
                            success: function(oGetResponse){
                                if (oGetResponse.entry){
                                    oCSVResource.id = oGetResponse.entry[0].resource.id;
                                } else {
                                    oModel.create(oCSVResource.resource.resourceType, oCSVResource.resource, transactionGroup);
                                }
                            },
                            error: function(oError){
                                console.log(oError.code, `${oError.message}\n${oError.additionalText}`);
                            }
                        }).getRequest());
                    });

                    Promise.allSettled(aGetRequests)
                    .then( (aGetResponses) => {
                        // aGetResponses = [
                        //    {"status":"fulfilled","value":{"resourceType":"Bundle" ...},
                        //    {"status":"rejected","value":{"resourceType":"Bundle" ...},
                        // ]
                        if (aGetResponses.every(oGetResponse=>oGetResponse.status==="fulfilled" && "entry" in oGetResponse.value)){
                            // set patient, organization and practitioner IDs in MedicationStatements
                            for (let oMS of oBundle.medicationStatements){
                                oMS.setPatientReference();
                                oMS.setPractitionerReference();
                                oMS.setOrganizationReference();
                                oModel.create(oMS.resource.resourceType, oMS.resource, transactionGroup);
                            }
                            oModel.submitChanges(transactionGroup);
                            resolve([]);
                            return;
                        }
                        oModel.submitChanges(transactionGroup, (aCreatedResources) => {
                            for (let oCSVResource of [...oBundle.patients, ...oBundle.practitioners, ...oBundle.organizations]){
                                if (!oCSVResource.id){
                                    for (let oCreatedResource of aCreatedResources){
                                        if (oCSVResource.isTheSameAs(oCreatedResource)){
                                            oCSVResource.id = oCreatedResource.id;
                                            break;
                                        }
                                    }
                                }
                            }
                            // set patient, organization and practitioner IDs in MedicationStatements
                            for (let oMS of oBundle.medicationStatements){
                                oMS.setPatientReference();
                                oMS.setPractitionerReference();
                                oMS.setOrganizationReference();
                                oModel.create(oMS.resource.resourceType, oMS.resource, transactionGroup);
                            }
                            oModel.submitChanges(transactionGroup);
                            resolve(aCreatedResources);
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
