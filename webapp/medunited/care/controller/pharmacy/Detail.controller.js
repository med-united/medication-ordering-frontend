sap.ui.define([
	"medunited/base/controller/AbstractDetailController",
	"../../utils/Formatter"
], function (AbstractDetailController, Formatter) {
	"use strict";

	return AbstractDetailController.extend("medunited.care.controller.pharmacy.Detail", {
		formatter: Formatter,
		getEntityName : function () {
			return "pharmacy";
		},
		getBindElementParams : function() {
			return {
				groupId : "pharmacyDetails"
			};
		}
	});
}, true);