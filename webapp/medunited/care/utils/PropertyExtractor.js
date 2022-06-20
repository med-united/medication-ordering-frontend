sap.ui.define([
], function () {
    "use strict";
    return {

        extractPatientNameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/given/0");
        },

        extractPatientSurnameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/family");
        },

        extractPharmacyEmailFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/managingOrganization/reference/telecom/1/value");
        },

        extractDoctorEmailFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/generalPractitioner/0/reference/telecom/1/value");
        },

        extractDoctorNameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/informationSource/reference/name/0/family");
        },

        extractDoctorSurnameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/informationSource/reference/name/0/given/0");
        },

        extractPznFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/identifier/0/value");
        },

        extractPatientBirthDateFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/birthDate");
        },
    };
}, true);