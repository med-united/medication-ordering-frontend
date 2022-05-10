sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter"
], function (AbstractDetailController, Formatter) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.practitioner.Detail", {
		formatter: Formatter,
		getEntityName : function () {
			return "practitioner";
		},
		getBindElementParams : function() {
			return {
				groupId : "practitionerDetails"
			};
		}
	});
}, true);