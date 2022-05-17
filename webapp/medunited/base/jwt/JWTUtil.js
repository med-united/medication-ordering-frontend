sap.ui.define([], function () {
	"use strict";

	return {
        getSalutation: function(sGivenName, sFamilyName) {
            return sGivenName+" "+sFamilyName;
        }
    };
}, true);