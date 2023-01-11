sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter",
	'medunited/care/utils/PropertyExtractor',
	'sap/m/MessageBox'
], function (AbstractDetailController, Formatter, PropertyExtractor, MessageBox) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.practitioner.Detail", {
		formatter: Formatter,
		getEntityName : function () {
			return "Practitioner";
		},
		getBindElementParams : function() {
			return {
				groupId : "practitionerDetails"
			};
		},
		validateResource: function () {
			const oView = this.getView();
			const sPractitionerId = this._entity;
			let fax = PropertyExtractor.extractFaxFromPractitioner(oView, "Practitioner/" + sPractitionerId);
			let prescriptionInterface = PropertyExtractor.extractPrescriptionInterfaceFromPractitioner(oView, "Practitioner/" + sPractitionerId);
            if (prescriptionInterface === "fax" && fax === undefined) {
				MessageBox.error(this.translate("msgFaxWasSelectedAsThePrescriptionInterfaceModeButNoFaxWasDefinedForThisPractitioner"), {
					title: this.translate("msgErrorTitle"),
					styleClass: "",
					actions: MessageBox.Action.OK,
					emphasizedAction: MessageBox.Action.OK,
					initialFocus: null,
					textDirection: sap.ui.core.TextDirection.Inherit
				});
				return false;
			}
			else {
				return true;

			}
		},
	});
}, true);