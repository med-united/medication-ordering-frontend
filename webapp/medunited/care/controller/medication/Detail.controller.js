sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter"
], function (AbstractDetailController, Formatter) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.medication.Detail", {
		formatter: Formatter,
		getEntityName : function () {
			return "Medication";
		},
		getBindElementParams : function() {
			return {
				groupId : "medicationDetails"
			};
		}
	});
}, true);