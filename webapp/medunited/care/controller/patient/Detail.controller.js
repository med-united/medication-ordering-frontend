sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
], function (AbstractDetailController) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.patient.Detail", {
		getEntityName : function () {
			return "patient";
		}
	});
}, true);