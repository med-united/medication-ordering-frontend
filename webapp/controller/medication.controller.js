sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/m/MessageToast'
], function (Controller, MessageToast) {
	"use strict";

	return Controller.extend("webapp.controller.medication", {

		onAvatarPressed: function () {
			MessageToast.show("Avatar pressed!");
		}

	});
});