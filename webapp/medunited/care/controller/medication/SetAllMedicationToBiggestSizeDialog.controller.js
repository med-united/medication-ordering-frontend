sap.ui.define([
    "./Master.controller",
    "sap/ui/model/ChangeReason",
    'sap/m/MessageBox',
    'sap/m/MessageToast',
], function (Master, ChangeReason, MessageBox, MessageToast) {
    "use strict";

    return Master.extend("medunited.care.controller.medication.SetAllMedicationToBiggestSizeDialog", {
        onInit: function() {
            Master.prototype.onInit.apply(this, arguments);
            this._mNewSize = {};
        },
        onDataReceived: function(oEvent) {
            const oBundle = oEvent.getParameter("data");
            if(oBundle.entry && oBundle.entry.length > 0) {
                const aMedicationStatements = oBundle.entry.filter((oEntry) => oEntry.search.mode === 'match');
                Promise.allSettled(
                    aMedicationStatements
                        // Map all medication statements to PZN
                        .map((aMedicationStatement) => aMedicationStatement.resource && aMedicationStatement.resource.identifier && aMedicationStatement.resource.identifier.length > 0 ? aMedicationStatement.resource.identifier[0].value : null)
                        // remove duplicates
                        .filter((value, index, self) => self.indexOf(value) === index)
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
                                        this._mNewSize[sPZN] = {
                                            newMedicationSize: sNormgroesse,
                                            newPZN: oBiggestPackage.pzn
                                        };
                                    }
                                })
                        : Promise.resolve() )
                )
                .then((aResults) => {
                    // Trigger the List Binding to rerender and reapply the formatter
                    this.getView().byId("medicationTable").getBinding("items")._fireChange({
                        reason: ChangeReason.Change
                    });
                }).catch((e) => {
                    console.log(e);
                })
                
            }
        },
        newSize: function (sPZN) {
            return this._mNewSize[sPZN] && this._mNewSize[sPZN].newPZN != sPZN ? this._mNewSize[sPZN].newMedicationSize : "";
        },
        newPZN: function (sPZN) {
            return this._mNewSize[sPZN] && this._mNewSize[sPZN].newPZN != sPZN ? this._mNewSize[sPZN].newPZN : "";
        },
        onUpdateShownMedication: function(oEvent) {
            const aContexts = this.byId("medicationTable").getBinding("items").getContexts();
            for(let oContext of aContexts) {
                const sPZN = oContext.getProperty("identifier/0/value");
                const oModel = oContext.getModel();
                if(this._mNewSize[sPZN] && this._mNewSize[sPZN].newPZN != sPZN) {
                    oModel.setProperty("identifier/0/value", this._mNewSize[sPZN].newPZN, oContext);
                    if(!oContext.getProperty("extension/0/valueString")) {
                        oModel.setProperty("extension/0/valueString", "1", oContext);    
                    }
                    oModel.setProperty("extension/1/valueString", this._mNewSize[sPZN].newMedicationSize, oContext);
                }
            }
            
            const fnSuccess = (oData) => {
                MessageToast.show(this.translate(this.getEntityName()) + ' ' + this.translate("msgSaveResourceSuccessful"));
            };

            const fnError = (oError) => {
                MessageBox.show(this.translate(this.getEntityName()) + ' ' + this.translate("msgSaveResouceFailed", [oError.statusCode, oError.statusText]));
            };

            var oRequest = this.getView().getModel().submitChanges("medicationStatementDetails", fnSuccess, fnError);
            
        }
    });
});