sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"./AbstractController",
	'sap/m/MessageBox',
	'sap/m/MessageToast',
	"sap/ui/core/Fragment",
	"medunited/care/utils/DemoAccount"
], function (JSONModel, AbstractController, MessageBox, MessageToast, Fragment, DemoAccount) {
	"use strict";

	return AbstractController.extend("medunited.base.controller.AbstractDetailController", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();

			// this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-master").attachPatternMatched(this._onMatched, this);
			this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-detail").attachPatternMatched(this._onMatched, this);
		},
		handleFullScreen: function () {
			this.navToLayoutProperty("/actionButtonsInfo/midColumn/fullScreen");
		},
		navToLayoutProperty: function(sLayoutProperty) {
			var oLayoutModel = this.getOwnerComponent().getModel("Layout");
			var sNextLayout = oLayoutModel.getProperty(sLayoutProperty);
			var oParams = {layout: sNextLayout};
			oParams[this.getEntityName().toLowerCase()] = this._entity;
			this.oRouter.navTo(this.getEntityName().toLowerCase()+"-detail", oParams);
		},
		handleExitFullScreen: function () {
			this.navToLayoutProperty("/actionButtonsInfo/midColumn/exitFullScreen");
		},
		handleClose: function () {
			var oLayoutModel = this.getOwnerComponent().getModel("Layout");
			var sNextLayout = oLayoutModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo(this.getEntityName().toLowerCase()+"-master", {layout: sNextLayout});
		},
		onEdit: function(){
            this.enableEditMode(true);
        },
		onSave: function (oEvent) {
			if(DemoAccount._isDemoAccount(this.getView())){
				return
			}
			let medicationStatementsOfPatient = this.getMedicationStatementsOfPatient(this._entity);
			let oModel = this.getView().getModel();
            for (let i of medicationStatementsOfPatient) {
				// Validate PZNs
				let pznValue = oModel.getProperty("/MedicationStatement/" + i + "/identifier/0/value");
				oModel.setProperty("/MedicationStatement/" + i + "/identifier/0/value", parseInt(pznValue, 10));
				// Validate Dosages
				let dosageValue = oModel.getProperty("/MedicationStatement/" + i + "/dosage/0/text");
				if (dosageValue === "" || dosageValue == null || dosageValue.trim().length === 0) {
					MessageBox.error(this.translate("msgAtLeastOneOfTheDosagesWasNotSpecified"), {
						title: this.translate("msgErrorTitle"),
						onClose: null,
						styleClass: "",
						actions: sap.m.MessageBox.Action.CLOSE,
						emphasizedAction: null,
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					});
					return
				}
				else if (dosageValue !== "" && dosageValue.trim().length > 0 && dosageValue.includes("-") && dosageValue.match(/-/g).length == 3) {
					let morgensDosage = dosageValue.split("-")[0].replace(/\s/g, "")
					let mittagsDosage = dosageValue.split("-")[1].replace(/\s/g, "")
					let abendsDosage = dosageValue.split("-")[2].replace(/\s/g, "")
					let nachtsDosage = dosageValue.split("-")[3].replace(/\s/g, "")
					if (morgensDosage == "") {
						morgensDosage = "0"
					}
					if (mittagsDosage == "") {
						mittagsDosage = "0"
					}
					if (abendsDosage == "") {
						abendsDosage = "0"
					}
					if (nachtsDosage == "") {
						nachtsDosage = "0"
					}
					if (/^\d+$/.test(morgensDosage.trim()) && /^\d+$/.test(mittagsDosage.trim()) && /^\d+$/.test(abendsDosage.trim()) && /^\d+$/.test(nachtsDosage.trim())) {
						let newDosageValue = parseInt(morgensDosage.trim(), 10) + "-" + parseInt(mittagsDosage.trim(), 10) + "-" + parseInt(abendsDosage.trim(), 10) + "-" + parseInt(nachtsDosage.trim(), 10)
						oModel.setProperty("/MedicationStatement/" + i + "/dosage/0/text", newDosageValue)
					}
					else {
						MessageBox.error(this.translate("msgAtLeastOneOfTheDosagesContainsCharactersThatAreNotDigits"), {
							title: this.translate("msgErrorTitle"),
							onClose: null,
							styleClass: "",
							actions: sap.m.MessageBox.Action.CLOSE,
							emphasizedAction: null,
							initialFocus: null,
							textDirection: sap.ui.core.TextDirection.Inherit
						});
						return
					}
				}
				else {
					MessageBox.error(this.translate("msgAtLeastOneOfTheDosagesDoesNotHaveTheRightFormat"), {
						title: this.translate("msgErrorTitle"),
						onClose: null,
						styleClass: "",
						actions: sap.m.MessageBox.Action.CLOSE,
						emphasizedAction: null,
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					});
					return
				}
			}
			let fnSuccess = function(oData){
                this.enableEditMode(false);
                MessageToast.show(this.translate(this.getEntityName()) + ' ' + this.translate("msgSaveResourceSuccessful"));
            }.bind(this);

            let fnError = function(oError){
                this.enableEditMode(false);
                MessageBox.show(this.translate(this.getEntityName()) + ' ' + this.translate("msgSaveResouceFailed", [oError.statusCode, oError.statusText]));
            }.bind(this);

            let oRequest = oModel.submitChanges(this.getEntityName().toLowerCase()+"Details", fnSuccess, fnError);
            if(!oRequest){
                this.enableEditMode(false);
            }
		},
		getMedicationStatementsOfPatient: function (patientId) {
			let oModel = this.getView().getModel();
			let medicationStatements = oModel.getProperty("/MedicationStatement");
			let medicationStatementsOfPatient = [];
			for (let medStat in medicationStatements) {
				if (oModel.getProperty("/MedicationStatement/" + medStat + "/subject/reference") == "Patient/" + patientId) {
					medicationStatementsOfPatient.push(medStat);
				}
			}
			return medicationStatementsOfPatient;
		},
		onCancel: function(oEvent) {
			this.enableEditMode(false);
            this.getView().getModel().resetChanges();
		},
		onDelete: function (oEvent) {
			this.getOwnerComponent().getRouter().navTo("master");
		},
		_onMatched: function (oEvent) {
			this._entity = oEvent.getParameter("arguments")[this.getEntityName().toLowerCase()];
			this.getView().bindElement({
				path: "/" + this.getEntityName() + "/" + this._entity,
				parameters: this.getBindElementParams()
			});
		},
		getBindElementParams: function () {
			return {};
		},
		getEntityName : function () {
			throw new Error("getEntityName must be implemented by derived class");
		},
		onExit: function () {
			this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-master").detachPatternMatched(this._onMatched, this);
			this.oRouter.getRoute(this.getEntityName().toLowerCase()+"-detail").detachPatternMatched(this._onMatched, this);
		},
		enableEditMode: function(bEditMode){
            this.getView().getModel("appState").setProperty("/editMode", bEditMode);
        }
	});
}, true);