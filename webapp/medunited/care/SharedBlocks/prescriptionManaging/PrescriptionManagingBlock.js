sap.ui.define(['sap/uxap/BlockBase'], function (BlockBase) {
    "use strict";
    return BlockBase.extend("medunited.care.SharedBlocks.prescriptionManaging.PrescriptionManagingBlock", {
        onPress: function (oSelect) {

            const sshTunnelUrl = "http://a5159e733bb724d73aeaa7d8e84ef474-446415281.eu-central-1.elb.amazonaws.com:8080"
            const publicKeyRetrievalEndpoint = "/publicKey"
            const queryKey = "?user="

            const practitionerId = oSelect.getSource().getBindingContext().sPath.split("/")[2]
            const practitionerName = this.oView.getModel().getProperty("/Practitioner/" + 1322 + "/name/0/given/0")
            const practitionerSurname = this.oView.getModel().getProperty("/Practitioner/" + 1322 + "/name/0/family")

            fetch(`${sshTunnelUrl}${publicKeyRetrievalEndpoint}${queryKey}${practitionerName} ${practitionerSurname}`, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }).then(response => response.json())
                .then(result => {
                    this.oView.getModel().setProperty("/Practitioner/" + practitionerId + "/extension/1/valueString", result.key);
                    this.oView.getModel().submitChanges();
                });
        },
    });
}, true);
