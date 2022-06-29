sap.ui.define([
    'medunited/care/utils/DateTimeMaker',
    'medunited/care/utils/PropertyExtractor',
], function (DateTimeMaker, PropertyExtractor) {
    "use strict";
    return {

        notifyPharmacy: function (oView, selectedPlans) {

            const that = this;

            const structure = this._populateStructure(oView, selectedPlans);

            for (const pharmacy of Object.entries(structure)) {
                let pharmacyEmail = PropertyExtractor.extractPharmacyEmailFromPlan(oView, pharmacy[1][0]);
                let patientNames = [];
                let practitionerNames = [];
                let pznNumbers = [];
                for (const plan of Object.entries(pharmacy[1])) {
                    patientNames.push(PropertyExtractor.extractPatientFullNameFromPlan(oView, plan[1]));
                    practitionerNames.push(PropertyExtractor.extractDoctorFullNameFromPlan(oView, plan[1]));
                    pznNumbers.push(PropertyExtractor.extractPznFromPlan(oView, plan[1]));
                }

                const params = that._createRequestParams(pharmacyEmail, patientNames, practitionerNames, pznNumbers);

                that._callPharmacyNotificationService(params);
            }
        },

        _populateStructure(oView, selectedPlans) {
            const structure = {};

            for (const plan of selectedPlans) {
                const pharmacy = oView.getModel().getProperty(plan + '/derivedFrom/0/reference');
                if (pharmacy in structure) {
                    structure[pharmacy].push(plan);
                }
                else {
                    structure[pharmacy] = [];
                    structure[pharmacy].push(plan);
                }
            }
            return structure;
        },

        _createRequestParams: function (pharmacyEmail, listOfPatients, listOfPractitioners, listOfPzns) {
            return {
                pharmacyEmail: pharmacyEmail,
                patients: listOfPatients,
                doctors: listOfPractitioners,
                pzns: listOfPzns,
                status: "active",
                requestDate: DateTimeMaker.makeCurrentDateTime()
            };
        },

        _callPharmacyNotificationService: function (params) {

            fetch('http://mail-sender.med-united.health/sendEmail/notifyPharmacy', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
        }
    };
}, true);