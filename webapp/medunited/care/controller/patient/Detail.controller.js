sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter"
], function (AbstractDetailController, Formatter) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.patient.Detail", {
		formatter: Formatter,
		getEntityName : function () {
			return "Patient";
		},
		getBindElementParams : function() {
			return {
				groupId : "patientDetails"
			};
		}
	});
}, true);