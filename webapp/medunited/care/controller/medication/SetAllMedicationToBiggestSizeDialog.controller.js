sap.ui.define([
    "./Master.controller",
    "sap/ui/model/json/JSONModel"
], function (Master, JSONModel) {
    "use strict";

    return Master.extend("medunited.care.controller.medication.SetAllMedicationToBiggestSizeDialog", {
        onInit: function() {
            Master.prototype.onInit.apply(this, arguments);
            this.getView().setModel(new JSONModel(), "NewSize");
        },
        onDataReceived: function(oEvent) {
            const oBundle = oEvent.getParameter("data");
            if(oBundle.entry && oBundle.entry.length > 0) {
                const aMedicationStatements = oBundle.entry.filter((oEntry) => oEntry.search.mode === 'match');
                this.getView().setBusy(true);
                Promise.allSettled(
                    aMedicationStatements
                        // Map all medication statements to PZN
                        .map((aMedicationStatement) => aMedicationStatement.resource && aMedicationStatement.resource.identifier && aMedicationStatement.resource.identifier.length > 0 ? aMedicationStatement.resource.identifier[0].value : null)
                        // Request medications for PZN
                        .map((sPZN) => sPZN ?
                            fetch("https://medication.med-united.health/ajax/search/drugs/auto/?query="+sPZN)
                                .then(r => r.json())
                                .then((oResponse) => {
                                    if(oResponse.maxResults > 0) {
                                        const oFirstResult = oResponse.results[0];
                                        const oBiggestPackage = oFirstResult.productFams[(oFirstResult.productFams.length-1)];
                                        let sNormgroesse = "";
                                        const aMatches = oBiggestPackage.packaging.match(/N\d/);
                                        if(aMatches) {
                                            sNormgroesse = aMatches[0];
                                        }
                                        return {
                                            newMedicationSize: sNormgroesse,
                                            newPZN: oBiggestPackage.pzn
                                        };
                                    }
                                })
                        : Promise.resolve() )
                )
                .then((aResults) => {
                    this.getView().getModel("NewSize").setData(aResults.map((oEntry) => oEntry.value));
                    this.getView().setBusy(false);
                }).catch((e) => {
                    console.log(e);
                    this.getView().setBusy(false);
                })
                
            }
        }
    });
});