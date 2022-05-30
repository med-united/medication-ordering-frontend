sap.ui.define([], function () {
    "use strict";
    return {

        // const oXmlModel = this.getView().getModel();
        // const oXmlDoc = oXmlModel.getData();
        // const sXml = new XMLSerializer().serializeToString(oXmlDoc.documentElement);
        // console.log(sXml);

        // const templateParams = {
        //     contactname: oXmlModel.getProperty("/recordTarget/patientRole/patient/name/given")
        //         + " "
        //         + oXmlModel.getProperty("/recordTarget/patientRole/patient/name/family"),
        //     contactemail: oXmlModel.getProperty("/recordTarget/patientRole/providerOrganization/telecom/@value"),
        //     contactmessage: oXmlModel.getProperty("/component/structuredBody/component/section").toString(),
        //     attachment: sXml,
        // };

        sendEarztBrief: function () {
            fetch('https://earztbrief-sender.med-united.health/sendEmail', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateParams)
            });
        }

    };
}, true);