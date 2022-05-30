sap.ui.define([
    'sap/ui/model/xml/XMLModel'
], function (XMLModel) {
    "use strict";
    return {

        sendEarztBrief: function (oView, earztbriefModel) {

            console.log(earztbriefModel);

            const oXmlDoc = earztbriefModel.getData();
            const sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);
            console.log(sXml);

            const patientGivenName = oView.getModel().getProperty("/Patient/1030/name/0/given/0");
            const patientFamilyName = oView.getModel().getProperty("/Patient/1030/name/0/family");
            const organizationEmail = oView.getModel().getProperty("/Patient/1030/managingOrganization/reference/telecom/1/value");

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
                    contactemail: organizationEmail,
                    contactmessage: earztbriefModel.getProperty("/component/structuredBody/component/section").toString(),
                    attachment: sXml,
                };
            }
        }
    };
}, true);