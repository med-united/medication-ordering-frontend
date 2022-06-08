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
            const testPzn = patientsAndMedications.get(testPatient)


            const name = oFhirModel.getProperty("/Patient/" + testPatient + "/name/0/given/0");
            const surname = oFhirModel.getProperty("/Patient/" + testPatient + "/name/0/family");

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
                            .replace("$PZN", testPzn[0])
                            .replace("$PZN", testPzn[0]);

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
        },

        _mapPatientsToMedicationsFrom(medicationPlansT2Med) {
            const patientsAndMedications = new Map();
            medicationPlansT2Med.forEach(plan => {
                const patient = plan.subject.reference.split("/")[1];
                if (patientsAndMedications.has(patient)) {
                    const medications = patientsAndMedications.get(patient);
                    medications.push(plan.identifier[0].value);
                    patientsAndMedications.set(patient, medications);
                } else {
                    const medications = [];
                    medications.push(plan.identifier[0].value);
                    patientsAndMedications.set(patient, medications);
                }
            });

            return patientsAndMedications;
        }
    };

}, true);