sap.ui.define([], function () {
    "use strict";
    return {

        makePowershellScript: function (oView) {

            const oFhirModel =oView.getModel();
            const medicationPlans = oFhirModel.getProperty("/MedicationStatement");

            const medicationPlansT2Med = this.filterPlansByDoctor(medicationPlans);

            const patientsT2Med = medicationPlansT2Med.map(val => {
                return val.subject.reference.split("/")[1];
            });

            const medicationsT2Med = medicationPlansT2Med.map(val => {
                return val.medicationCodeableConcept.text;
            });

            const name = oFhirModel.getProperty("/Patient/" + patientsT2Med[0] + "/name/0/given/0");
            const surname = oFhirModel.getProperty("/Patient/" + patientsT2Med[0] + "/name/0/family");

            fetch('resources/local/t2med.ps1')
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.readAsText(blob);
                    reader.onload = () => {
                        const sText = reader.result;
                        const sNewText = sText.replace("$patientName", name).replace("$patientSurname", surname);
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

        filterPlansByDoctor: function (medicationPlans) {
            const t2medPlans = [];
            Object.values(medicationPlans).forEach(val => {
                if ((val.hasOwnProperty("informationSource"))) {
                    const practitionerId = val.informationSource.reference.split("/")[1];
                    if (practitionerId == "56") {
                        t2medPlans.push(val);
                    }
                }
            });
            return t2medPlans;
        },
    };

}, true);