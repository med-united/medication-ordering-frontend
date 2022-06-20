sap.ui.define([
    'medunited/care/utils/PropertyExtractor'
], function (PropertyExtractor) {
    "use strict";
    return {

        sendEarztBrief: function (oView, selectedPlans, earztbriefModel) {

            const oXmlDoc = earztbriefModel.getData();
            const sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);

            const that = this;

            selectedPlans.forEach(function (plan) {
                const patientGivenName = PropertyExtractor.extractPatientNameFrom(oView, plan);
                const patientFamilyName = PropertyExtractor.extractPatientSurnameFrom(oView, plan);
                const doctorEmail = PropertyExtractor.extractDoctorEmailFrom(oView, plan);
                const patientBirthDate = PropertyExtractor.extractPatientBirthDateFrom(oView, plan);

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