sap.ui.define([
], function () {
    "use strict";
    return {

        sendEarztBrief: function (oView, selectedPlans, earztbriefModel) {

            const oXmlDoc = earztbriefModel.getData();
            const sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);

            selectedPlans.forEach(function (plan) {
                const patientGivenName = extractNameFrom(oView, plan);
                const patientFamilyName = extractSurnameFrom(oView, plan);
                const doctorEmail = extractDoctorEmailFrom(oView, plan);
                const patientBirthDate = extractPatientBirthDateFrom(oView, plan);

                bindXmlProperties(earztbriefModel, patientGivenName, patientFamilyName, doctorEmail, patientBirthDate);

                const templateParams = createRequestParams(
                    earztbriefModel,
                    patientGivenName,
                    patientFamilyName,
                    doctorEmail,
                    patientBirthDate);

                fetch('https://earztbrief-sender.med-united.health/sendEmail', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateParams)
                });
            });
        },

        extractPatientBirthDateFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/birthDate");
        },

        extractDoctorEmailFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/generalPractitioner/0/reference/telecom/1/value");
        },

        extractSurnameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/family");
        },

        extractNameFrom: function (oView, plan) {
            return oView.getModel().getProperty(plan + "/subject/reference/name/0/given/0");
        },

        bindXmlProperties: function (earztbriefModel, patientGivenName, patientFamilyName, doctorEmail, patientBirthDate) {
            earztbriefModel.setProperty("/recordTarget/patientRole/patient/name/given", patientGivenName);
            earztbriefModel.setProperty("/recordTarget/patientRole/patient/name/family", patientFamilyName);
            earztbriefModel.setProperty("/recordTarget/patientRole/patient/birthTime/@value", patientBirthDate);
        },

        createRequestParams: function (earztbriefModel, patientGivenName, patientFamilyName, doctorEmail, patientBirthDate) {
            return {
                contactname: patientGivenName + " " + patientFamilyName,
                contactemail: "simone.stifano@incentergy.de",
                contactmessage: earztbriefModel.getProperty("/component/structuredBody/component/section").toString(),
                attachment: sXml,
            };
        }

    };
}, true);