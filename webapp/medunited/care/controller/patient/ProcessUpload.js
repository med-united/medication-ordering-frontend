sap.ui.define([
    'medunited/care/lib/jquery-csv'
], function () {
    "use strict";
    return {
        processUploadedFile: function (file, controller) {
            // Create a File Reader object
            var oReader = new FileReader();

            oReader.onload = function (e) {
                let data = $.csv.toObjects(e.target.result);

                let patientTemplate             = controller.getView().getModel("patient");
                let medicationStatementTemplate = controller.getView().getModel("medicationStatement");
                let practitionerTemplate        = controller.getView().getModel("practitioner");
                let organizationTemplate        = controller.getView().getModel("organization");
                let medicationTemplate          = controller.getView().getModel("medication");

                let bundle = {
                    "resourceType": "Bundle",
                    "type": "transaction",
                    "entry": []
                }

                for (let dataRow of data) {

                    bundle.entry.push({
                        "resource": structuredClone(medicationTemplate.getData()),
                        "request": {
                            "method": "POST",
                            "url": "Medication"
                        }
                    });

                    let resourceFound = false;
                    for (let bundleEntry of bundle.entry) {
                        resourceFound = bundleEntry.resource.resourceType === "Organization"
                            && bundleEntry.resource.name === dataRow["PharmacyName"];
                        if (resourceFound) break;
                    }

                    if (!resourceFound) {
                        organizationTemplate.setProperty("/name", dataRow["PharmacyName"]);
                        organizationTemplate.setProperty("/address/0/line/0", dataRow["PharmacyAddress"]);
                        organizationTemplate.setProperty("/address/0/postalCode", dataRow["PharmacyPostalCode"]);
                        organizationTemplate.setProperty("/address/0/city", dataRow["PharmacyCity"]);
                        organizationTemplate.setProperty("/telecom/0/value", dataRow["PharmacyPhone"]);
                        organizationTemplate.setProperty("/telecom/1/value", dataRow["PharmacyEMail"]);

                        bundle.entry.push({
                            "resource": structuredClone(organizationTemplate.getData()),
                            "request": {
                                "method": "POST",
                                "url": "Organization"
                            }
                        });
                    }

                    resourceFound = false;
                    for (let bundleEntry of bundle.entry) {
                        resourceFound = bundleEntry.resource.resourceType === "Practitioner"
                            && bundleEntry.resource.name[0].family === dataRow["PractitionerFamilyName"]
                            && bundleEntry.resource.name[0].given[0] === dataRow["PractitionerGivenName"];
                        if (resourceFound) break;
                    }

                    if (!resourceFound) {
                        practitionerTemplate.setProperty("/name/0/family", dataRow["PractitionerFamilyName"]);
                        practitionerTemplate.setProperty("/name/0/given/0", dataRow["PractitionerGivenName"]);
                        practitionerTemplate.setProperty("/address/0/line/0", dataRow["PractitionerAddress"]);
                        practitionerTemplate.setProperty("/address/0/postalCode", dataRow["PractitionerPostalCode"]);
                        practitionerTemplate.setProperty("/address/0/city", dataRow["PractitionerCity"]);
                        practitionerTemplate.setProperty("/telecom/0/value", dataRow["PractitionerPhone"]);
                        practitionerTemplate.setProperty("/telecom/1/value", dataRow["PractitionerEMail"]);

                        bundle.entry.push({
                            "resource": structuredClone(practitionerTemplate.getData()),
                            "request": {
                                "method": "POST",
                                "url": "Practitioner"
                            }
                        });
                    }

                    patientTemplate.setProperty("/name/0/given/0", dataRow["PatientGivenName"]);
                    patientTemplate.setProperty("/name/0/family", dataRow["PatientFamilyName"]);
                    patientTemplate.setProperty("/birthDate", dataRow["PatientBirthdate"]);

                    bundle.entry.push({
                        "resource": structuredClone(patientTemplate.getData()),
                        "request": {
                            "method": "POST",
                            "url": "Patient"
                        }
                    });

                    medicationStatementTemplate.setProperty("/medicationCodeableConcept/coding/0/display", dataRow["MedicationName"]);
                    medicationStatementTemplate.setProperty("/medicationCodeableConcept/coding/0/code", dataRow["MedicationPZN"]);
                    //medicationStatementTemplate.setProperty("/medicationCodeableConcept/coding/0/display", dataRow["MedicationSize"]);
                    medicationStatementTemplate.setProperty("/dosage/0/text", dataRow["MedicationDosage"]);

                    bundle.entry.push({
                        "resource": structuredClone(medicationStatementTemplate.getData()),
                        "request": {
                            "method": "POST",
                            "url": "MedicationStatement"
                        }
                    });

                };

                fetch('http://localhost:8080/fhir', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + controller.getOwnerComponent().jwtToken
                    },
                    body: JSON.stringify(bundle)
                });
            };
            oReader.readAsBinaryString(file);
        }
    };

}, true);