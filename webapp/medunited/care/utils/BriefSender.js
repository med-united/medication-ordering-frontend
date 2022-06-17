sap.ui.define([
], function () {
    "use strict";
    return {

        sendEarztBrief: function (oView, selectedPlans, earztbriefModel) {

            const oXmlDoc = earztbriefModel.getData();
            const sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);

            const that = this;

            selectedPlans.forEach(function (plan) {
                const patientGivenName = that._extractNameFrom(oView, plan);
                const patientFamilyName = that._extractSurnameFrom(oView, plan);
                const doctorEmail = that._extractDoctorEmailFrom(oView, plan);
                const patientBirthDate = that._extractPatientBirthDateFrom(oView, plan);

                that._bindXmlProperties(earztbriefModel, patientGivenName, patientFamilyName, doctorEmail, patientBirthDate);

                const templateParams = that._createRequestParams(
                    earztbriefModel,
                    patientGivenName,
                    patientFamilyName,
                    doctorEmail,
                    patientBirthDate,
                    sXml);

                fetch('https://mail-sender.med-united.health/sendEmail/earztbrief', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateParams)
                });
            });
        },

        _extractPatientBirthDateFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/birthDate");
        },

        _extractDoctorEmailFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/generalPractitioner/0/reference/telecom/1/value");
        },

        _extractSurnameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/family");
        },

        _extractNameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/given/0");
        },

        _bindXmlProperties: function (earztbriefModel, patientGivenName, patientFamilyName, doctorEmail, patientBirthDate) {
            earztbriefModel.setProperty("/recordTarget/patientRole/patient/name/given", patientGivenName);
            earztbriefModel.setProperty("/recordTarget/patientRole/patient/name/family", patientFamilyName);
            earztbriefModel.setProperty("/recordTarget/patientRole/patient/birthTime/@value", patientBirthDate);
        },

        _createRequestParams: function (earztbriefModel, patientGivenName, patientFamilyName, doctorEmail, patientBirthDate, sXml) {
            return {
                contactName: patientGivenName + " " + patientFamilyName,
                contactEmail: "simone.stifano@incentergy.de",
                contactMessage: earztbriefModel.getProperty("/component/structuredBody/component/section").toString(),
                attachment: sXml,
            };
        }
    };
}, true);