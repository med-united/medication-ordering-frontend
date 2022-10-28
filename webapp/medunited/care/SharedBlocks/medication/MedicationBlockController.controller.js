sap.ui.define([
    "medunited/base/controller/AbstractController",
    "../../utils/Formatter",
    "sap/fhir/model/r4/FHIRFilter",
    "sap/fhir/model/r4/FHIRFilterType",
    "sap/fhir/model/r4/FHIRFilterOperator",
    "../../search/MedicationSearchProvider",
    "sap/ui/core/Item",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/ColumnListItem"
], function (AbstractController, Formatter, FHIRFilter, FHIRFilterType, FHIRFilterOperator, MedicationSearchProvider, Item, MessageToast, MessageBox, ColumnListItem) {
    "use strict";

    return AbstractController.extend("medunited.care.SharedBlocks.medication.MedicationBlockController", {

        formatter: Formatter,

        onInit: function () {
            this.initializeRouter();

            // this is a workaround because the block controller gets initialized after the desired route is matched the first time
            var fnInitialFiltering = function (oEvent) {
                var oMedicationTable = oEvent.getSource();
                var oBindingContext = oMedicationTable.getBindingContext();
                if (oBindingContext) {
                    // here comes eg. '/Patient/123'
                    var sPatientId = oBindingContext.getPath().split("/")[2];
                    this.filterMedicationTableToPatient(sPatientId);
                    oMedicationTable.detachModelContextChange(fnInitialFiltering);
                }
            };
            this.getView().byId("medicationTable").attachModelContextChange(fnInitialFiltering.bind(this));

            this._oMedicationSearchProvider = new MedicationSearchProvider();
            // npm install -g local-cors-proxy
            // lcp --proxyUrl https://www.apotheken-umschau.de/
            // http://localhost:8010/proxy
            this._oMedicationSearchProvider.setSuggestUrl("https://medication.med-united.health/ajax/search/drugs/auto/?query={searchTerms}");
        },

        initializeRouter: function () {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getRoute("patient-detail").attachPatternMatched(this.onPatientRouteMatched, this);
        },
        onDataReceivedAsureStructure: function(oEvent) {
            const oData = oEvent.getParameter("data");
			if(!oData.entry || oData.entry.length == 0) {
				return;
			}
            let dLastDouble = 0.0;

			for(let oMedicationStatement of oData.entry) {
				if(!oMedicationStatement.resource.identifier) {
                    oMedicationStatement.resource.identifier = [
                        {"value":undefined}
                    ];
                }
                if(!oMedicationStatement.resource.dosage) {
                    oMedicationStatement.resource.dosage = [
                        {"text":undefined}
                    ];
                }
                if(!oMedicationStatement.resource.extension) {
                    oMedicationStatement.resource.extension = [
                        {"valueString":undefined},
                        {"valueString":undefined},
                        {"valueDecimal":dLastDouble}
                    ];
                } else if(oMedicationStatement.resource.extension.length == 1) {
                    oMedicationStatement.resource.extension.push({"valueString":undefined});
                    oMedicationStatement.resource.extension.push({"valueDecimal":dLastDouble});
                } else if(oMedicationStatement.resource.extension.length == 2) {
                    oMedicationStatement.resource.extension.push({"valueDecimal":dLastDouble});
                }
                if(!oMedicationStatement.resource.note) {
                    oMedicationStatement.resource.note = [
                        {"text":undefined}
                    ];
                }
                if(!oMedicationStatement.resource.informationSource) {
                    oMedicationStatement.resource.informationSource = {"reference":undefined};
                }
                if(!oMedicationStatement.resource.derivedFrom) {
                    oMedicationStatement.resource.derivedFrom = [
                        {"reference":undefined}
                    ];
                }
                dLastDouble = oMedicationStatement.resource.extension[2].valueDecimal+1;
            }
            oData.entry = oData.entry.sort(function compareFn(a, b) {
                return a.resource.extension[2].valueDecimal - b.resource.extension[2].valueDecimal;
            })
        },
        onPatientRouteMatched: function (oEvent) {
            var sPatientId = oEvent.getParameter("arguments").patient;
            this.filterMedicationTableToPatient(sPatientId);
        },

        filterMedicationTableToPatient: function (sPatientId) {
            var aFilters = [];
            aFilters.push(new FHIRFilter({ path: "subject", operator: FHIRFilterOperator.StartsWith, value1: "Patient/" + sPatientId, valueType: FHIRFilterType.string }));
            const oTable = this.getView().byId("medicationTable");
            const oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },
        addMedication: function () {
            var sPatientId = this.byId("medicationTable").getBindingContext().getPath().split("/")[2];
            var sMedicationStatementId = this.getView().getModel().create("MedicationStatement", { subject: { reference: "Patient/" + sPatientId } }, "patientDetails");
        },
        deleteMedication: function () {
            const aResources = this.byId("medicationTable").getSelectedItems().map(oItem => oItem.getBindingContext().getPath());
            const iCount = aResources.length;
            const oModel = this.getView().getModel();
            const me = this;
            oModel.remove(aResources);

            oModel.submitChanges(function () {
                MessageToast.show(me.translate("msgCountDeleted", iCount));
            }.bind(this), function (oError) {
                MessageBox.show(me.translate("msgDeleteFailed", [oError.statusCode, oError.statusText]));
            });
        },
        onSuggestMedicationName: function (oEvent) {
            var sTerm = oEvent.getParameter("suggestValue");
            var oController = this.getView().getController();

            this._oMedicationSearchProvider.suggest(sTerm, function (sValue, aSuggestions) {
                this.destroySuggestionItems();

                for (var i = 0; i < aSuggestions.length; i++) {
                    this.addSuggestionItem(new Item({
                        text: oController.cleanMedicationNameResults(aSuggestions[i].name) + " (" + aSuggestions[i].pzn + ")"
                    }));
                }
            }.bind(oEvent.getSource()));
        },
        cleanMedicationNameResults: function (medicationNameFromSearchProvider) {
            let htmlTagsRegex = /<\/?[^>]+>/g;
            return medicationNameFromSearchProvider.replace(htmlTagsRegex, '');
        },
        onSuggestionMedicationNameSelected: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            let itemSelected = oItem.getText();
            let pznRegex = new RegExp(/\([0-9]*\)/, "g");
            let allNumbersBetweenParenthesisMatches = itemSelected.match(pznRegex);
            let lastMatch = allNumbersBetweenParenthesisMatches.length - 1;

            let medicationPZN = allNumbersBetweenParenthesisMatches[lastMatch].replace(/\(/, '').replace(/\)/, '');
            let medicationName = itemSelected.replace("\(" + medicationPZN + "\)", "");

            var source = oEvent.getSource();
            source.getModel().setProperty(source.getBindingContext().getPath("medicationCodeableConcept/text"), medicationName);
            source.getModel().setProperty(source.getBindingContext().getPath("identifier/0/value"), medicationPZN);
        },
        onSuggestPZN: function (oEvent) {
            let sTerm = oEvent.getParameter("suggestValue");
            let leadingZeros;
            if (sTerm.match(/^0+/) != null) {
                leadingZeros = sTerm.match(/^0+/)[0];
            }
            else {
                leadingZeros = "";
            }
            let oController = this.getView().getController();
            this._oMedicationSearchProvider.suggest(sTerm, function (sValue, aSuggestions) {
                this.destroySuggestionItems();

                for (let i = 0; i < aSuggestions.length; i++) {
                    this.addSuggestionItem(new Item({
                        text: leadingZeros + aSuggestions[i].pzn + " (" + oController.cleanMedicationNameResults(aSuggestions[i].name) + ")"
                    }));
                }
            }.bind(oEvent.getSource()));
        },
        onSuggestionPZNSelected: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            let itemSelected = oItem.getText();
            let pznRegex = new RegExp(/\d*\s/);
            let pznMatch = itemSelected.match(pznRegex)[0];

            let medicationPZN = pznMatch.trim();
            let medicationName = itemSelected.replace(pznRegex, "").slice(1, -1);

            var source = oEvent.getSource();
            source.getModel().setProperty(source.getBindingContext().getPath("medicationCodeableConcept/text"), medicationName);
            source.getModel().setProperty(source.getBindingContext().getPath("identifier/0/value"), medicationPZN);
        },
        onDropSelectedMedicationTable: function(oEvent) {
            var oDraggedItem = oEvent.getParameter("draggedControl");
			var oDraggedItemContext = oDraggedItem.getBindingContext();
			if (!oDraggedItemContext) {
				return;
			}

			var oRanking = {
                Initial: 0,
                Default: 1024,
                Before: function(iRank) {
                    return iRank + 1024;
                },
                Between: function(iRank1, iRank2) {
                    // limited to 53 rows
                    return (iRank1 + iRank2) / 2;
                },
                After: function(iRank) {
                    return iRank / 2;
                }
            };
			var iNewRank = oRanking.Default;
			var oDroppedItem = oEvent.getParameter("droppedControl");

			if (oDroppedItem instanceof ColumnListItem) {
				// get the dropped row data
				var sDropPosition = oEvent.getParameter("dropPosition");
				var oDroppedItemContext = oDroppedItem.getBindingContext();
				var iDroppedItemRank = oDroppedItemContext.getProperty("extension/2/valueDecimal");
				var oDroppedTable = oDroppedItem.getParent();
				var iDroppedItemIndex = oDroppedTable.indexOfItem(oDroppedItem);

				// find the new index of the dragged row depending on the drop position
				var iNewItemIndex = iDroppedItemIndex + (sDropPosition === "After" ? 1 : -1);
				var oNewItem = oDroppedTable.getItems()[iNewItemIndex];
				if (!oNewItem) {
					// dropped before the first row or after the last row
					iNewRank = oRanking[sDropPosition](iDroppedItemRank);
				} else {
					// dropped between first and the last row
					var oNewItemContext = oNewItem.getBindingContext();
					iNewRank = oRanking.Between(iDroppedItemRank, oNewItemContext.getProperty("extension/2/valueDecimal"));
				}
			}

			// set the rank property and update the model to refresh the bindings
			var oSelectedProductsTable = this.byId("medicationTable");
			var oProductsModel = oSelectedProductsTable.getModel();
			oProductsModel.setProperty("extension/2/valueDecimal", iNewRank, oDraggedItemContext);
        }
    });
});