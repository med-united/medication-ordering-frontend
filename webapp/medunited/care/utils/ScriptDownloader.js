sap.ui.define([], function () {
    "use strict";
    return {

        makePowershellScript: function (oView, selectedPlans) {

            const oFhirModel = oView.getModel();

            const medicationPlansT2Med = selectedPlans.map(plan => {
                return oFhirModel.getProperty(plan);
            });

            const patientsAndMedications = this._mapPatientsToMedicationsFrom(medicationPlansT2Med);

            //Create script for the first patient in the map and for the first medication
            const testPatient = patientsAndMedications.keys().next().value
            const testPznAndDosage = patientsAndMedications.get(testPatient)

            const pzn = this._extractPznFrom(testPznAndDosage);
            const dosage = this._extractDosage(testPznAndDosage);

            const name = oFhirModel.getProperty("/Patient/" + testPatient + "/name/0/given/0");
            const surname = oFhirModel.getProperty("/Patient/" + testPatient + "/name/0/family");

            this._parameterizeScript(name, surname, pzn, dosage);
        },

        _mapPatientsToMedicationsFrom(medicationPlansT2Med) {
            const patientsAndMedications = new Map();
            medicationPlansT2Med.forEach(plan => {
                const patient = plan.subject.reference.split("/")[1];
                if (patientsAndMedications.has(patient)) {
                    const medications = patientsAndMedications.get(patient);
                    medications.push(plan.identifier[0].value);
                    medications.push(plan.dosage[0].text);
                    patientsAndMedications.set(patient, medications);
                } else {
                    const medications = [];
                    medications.push(plan.identifier[0].value);
                    medications.push(plan.dosage[0].text);
                    patientsAndMedications.set(patient, medications);
                }
            });

            return patientsAndMedications;
        },

        _extractPznFrom(testPznAndDosage) {
            return testPznAndDosage[0];
        },

        _extractDosage(testPznAndDosage) {
            const dosageParts = testPznAndDosage[1].split("-");
            return {
                morning: dosageParts[0],
                midday: dosageParts[1],
                evening: dosageParts[2],
                night: dosageParts[3]
            }
        },

        _parameterizeScript(name, surname, pzn, dosage) {
            fetch('resources/local/t2med.ps1')
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.readAsText(blob);
                    reader.onload = () => {

                        const sText = reader.result;

                        const sNewText = sText
                            .replace("$patientName", name)
                            .replace("$patientSurname", surname)
                            .replace("$PZN", pzn)
                            .replace("$PZN", pzn)
                            .replace("$PZN", pzn)
                            .replace("$morgens", dosage.morning)
                            .replace("$mittags", dosage.midday)
                            .replace("$abends", dosage.evening)
                            .replace("$nachts", dosage.night);

                        const newBlob = new Blob([sNewText], { type: "text/plain" });
                        const sFileName = "t2med";
                        const sFileType = "text/plain";
                        const sFileExtension = "ps1";
                        const sFile = new File([newBlob], sFileName, { type: sFileType });
                        const oEvent = new MouseEvent("click", {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        const oLink = document.createElement("a");
                        oLink.href = URL.createObjectURL(sFile);
                        oLink.download = sFileName + "." + sFileExtension;
                        oLink.dispatchEvent(oEvent);
                    }
                })
        }
    };

}, true);