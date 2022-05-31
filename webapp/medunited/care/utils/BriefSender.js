sap.ui.define([
], function () {
    "use strict";
    return {

        sendEarztBrief: function (oView, selectedPlans, earztbriefModel) {

            console.log(earztbriefModel);

            const oXmlDoc = earztbriefModel.getData();
            const sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);
            console.log(sXml);

            const patientGivenName = oView.getModel().getProperty(selectedPlans[0] + "/subject/reference/name/0/given/0");
            const patientFamilyName = oView.getModel().getProperty(selectedPlans[0] + "/subject/reference/name/0/family");
            const doctorEmail = oView.getModel().getProperty(selectedPlans[0] + "/subject/reference/generalPractitioner/0/reference/telecom/1/value");


            const templateParams = createRequestParams();

            fetch('https://earztbrief-sender.med-united.health/sendEmail', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateParams)
            });

            function createRequestParams() {
                return {
                    contactname: patientGivenName + " " + patientFamilyName,
                    contactemail: doctorEmail,
                    contactmessage: earztbriefModel.getProperty("/component/structuredBody/component/section").toString(),
                    attachment: sXml,
                };
            }
        }
    };
}, true);