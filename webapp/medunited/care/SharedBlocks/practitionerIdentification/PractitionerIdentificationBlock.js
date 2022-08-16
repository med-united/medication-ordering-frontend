sap.ui.define(['sap/uxap/BlockBase'], function (BlockBase) {
	"use strict";
	return BlockBase.extend("medunited.care.SharedBlocks.practitionerIdentification.PractitionerIdentificationBlock", {
		metadata: {
			views: {
				Collapsed: {
					viewName: "medunited.care.SharedBlocks.practitionerIdentification.PractitionerIdentificationBlockCollapsed",
					type: "XML"
				},
				Expanded: {
					viewName: "medunited.care.SharedBlocks.practitionerIdentification.PractitionerIdentificationBlockExpanded",
					type: "XML"
				}
			}
		}
	});
}, true);
