sap.ui.define([
    'medunited/care/utils/DateTimeMaker'
], function (DateTimeMaker) {
    "use strict";
    return {

        notifyPharmacy: function (oView, selectedPlans) {

            const that = this;

            selectedPlans.forEach(function (plan) {
                const pharmacyEmail = that._extractPharmacyEmailFrom(oView, plan);

                const patientName = that._extractNameFrom(oView, plan);

                const patientSurname = that._extractSurnameFrom(oView, plan);

                const doctorName= that._extractDoctorNameFrom(oView, plan);

                const doctorSurname = that._extractDoctorSurnameFrom(oView, plan);

                const pzn = that._extractPznFrom(oView, plan);

                const params = that._createRequestParams(pharmacyEmail, patientName, patientSurname, doctorName, doctorSurname, pzn);

                that._callPharmacyNotificationService(params);
            });
        },

        _extractPharmacyEmailFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/managingOrganization/reference/telecom/1/value");
        },

        _extractSurnameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/family");
        },

        _extractNameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/given/0");
        },

        _extractDoctorNameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/informationSource/reference/name/0/family");
        },

        _extractDoctorSurnameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/informationSource/reference/name/0/given/0");
        },

        _extractPznFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/identifier/0/value");
        },

        _createRequestParams: function (pharmacyEmail, patientName, patientSurname, doctorName, doctorSurname, pzn) {
            return {
                pharmacyEmail: pharmacyEmail,
                patient: patientName + patientSurname,
                doctor: doctorName + doctorSurname,
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