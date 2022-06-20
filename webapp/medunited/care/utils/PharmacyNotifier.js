sap.ui.define([
    'medunited/care/utils/DateTimeMaker',
    'medunited/care/utils/PropertyExtractor',
], function (DateTimeMaker, PropertyExtractor) {
    "use strict";
    return {

        notifyPharmacy: function (oView, selectedPlans) {

            const that = this;

            selectedPlans.forEach(function (plan) {
                const pharmacyEmail = PropertyExtractor.extractPharmacyEmailFrom(oView, plan);

                const patient = {
                    name: PropertyExtractor.extractPatientNameFrom(oView, plan),
                    surname: PropertyExtractor.extractPatientSurnameFrom(oView, plan),
                };

                const doctor = {
                    name: PropertyExtractor.extractDoctorNameFrom(oView, plan),
                    surname: PropertyExtractor.extractDoctorSurnameFrom(oView, plan),
                };

                const pzn = PropertyExtractor.extractPznFrom(oView, plan);

                const params = that._createRequestParams(pharmacyEmail, patient, doctor, pzn);

                that._callPharmacyNotificationService(params);
            });
        },

        _createRequestParams: function (pharmacyEmail, patient, doctor, pzn) {
            return {
                pharmacyEmail: pharmacyEmail,
                patient: patient.name + " " + patient.surname,
                doctor: doctor.name + " " + doctor.surname,
                pzn: pzn,
                status: "active",
                requestDate: DateTimeMaker.makeCurrentDateTime()
            };
        },

        _callPharmacyNotificationService: function (params) {

            fetch('https://mail-sender.med-united.health/sendEmail/notifyPharmacy', {
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