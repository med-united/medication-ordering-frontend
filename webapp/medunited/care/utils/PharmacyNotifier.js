sap.ui.define([
], function () {
    "use strict";
    return {

        notifyPharmacy: function (oView, selectedPlans) {

            const that = this;

            selectedPlans.forEach(function (plan) {
                const pharmacyEmail = that._extractPharmacyEmailFrom(oView, plan);

                const params = that._createRequestParams(pharmacyEmail);

                that._callPharmacyNotificationService(params);
            });
        },

        _extractPharmacyEmailFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/managingOrganization/reference/telecom/1/value");
        },

        _createRequestParams: function (pharmacyEmail) {
            return {
                pharmacyEmail: pharmacyEmail,
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