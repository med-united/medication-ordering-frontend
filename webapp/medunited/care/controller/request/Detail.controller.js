sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter",
	"sap/ui/model/json/JSONModel"
], function (AbstractDetailController, Formatter, JSONModel) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.request.Detail", {
		formatter: Formatter,
		getEntityName : function () {
			return "request";
		},
		getBindElementParams : function() {
			return {
				groupId : "requestDetails"
			};
		},
		_onMatched: function (oEvent) {
			this._entity = oEvent.getParameter("arguments")[this.getEntityName().toLowerCase()];
			this.getView().bindElement({
				path: "/MedicationRequest/" + this._entity,
				parameters: this.getBindElementParams()
			});

			const aNote = this.getView().getModel().getProperty("/MedicationRequest/" + this._entity+"/note");
			const oJsonModel = new JSONModel();
			oJsonModel.setData(aNote);
			let oView = this.byId("annotationBlock")._getSelectedViewContent()
			if(oView) {
				oView.getContent()[0].setModel(oJsonModel, "Note");
			} else {
				this.byId("annotationBlock").attachViewInit((oEvent) => {
					oEvent.getParameter("view").getContent()[0].setModel(oJsonModel, "Note");;
				});
			}
		}
	});
}, true);