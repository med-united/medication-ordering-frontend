sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"sap/fhir/model/r4/FHIRListBinding",
	"sap/fhir/model/r4/FHIRModel",
	"sap/fhir/model/r4/FHIRUtils",
	"sap/fhir/model/r4/lib/FHIRRequestor",
	"sap/fhir/model/r4/SubmitMode",
	"sap/fhir/model/r4/lib/HTTPMethod",
	"sap/fhir/model/r4/lib/RequestHandle"
], function (UIComponent, JSONModel, FlexibleColumnLayoutSemanticHelper, FHIRListBinding, FHIRModel, FHIRUtils, FHIRRequestor, SubmitMode, HTTPMethod, RequestHandle) {
	"use strict";

	return UIComponent.extend("medunited.care.Component", {

		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		init: function () {
			this.fixPagingAndAggregateSameQueriesOfFhirModel();
			UIComponent.prototype.init.apply(this, arguments);

			this.getModel().setSizeLimit(25);


			var oRouter = this.getRouter();
			const keycloak = new Keycloak();

			var oJwtModel = new JSONModel();
			this.setModel(oJwtModel, "JWT");

			const me = this;

			keycloak.init({ "onLoad": "login-required", "checkLoginIframe": false }).then(function (authenticated) {
				console.log(authenticated ? 'authenticated' : 'not authenticated');
				if (authenticated) {
					// Add JWT token to all jQuery ajax requests
					// This will work with the FHIR Model
					// https://github.com/SAP/openui5-fhir/blob/v2.3.0/src/sap/fhir/model/r4/lib/FHIRRequestor.js#L324
					$.ajaxSetup({
						headers: { 'Authorization': 'Bearer ' + keycloak.token }
					});
					oJwtModel.setData(me.parseJwt(keycloak.token));
					oRouter.initialize();
					me.jwtToken = keycloak.token;
					me.keycloak = keycloak;
					me.afterAuthenticated();
				}
			}).catch(function (e) {
				console.log('failed to initialize');
			});

			var oModel = new JSONModel();
			this.setModel(oModel, "Layout");

			keycloak.onTokenExpired = () => {
				keycloak.updateToken(50).success((refreshed) => {
					if (refreshed) {
						$.ajaxSetup({
							headers: { 'Authorization': 'Bearer ' + keycloak.token }
						});
						oJwtModel.setData(me.parseJwt(keycloak.token));
					}
				}).error(() => {
					console.error('Failed to refresh token ' + new Date());
				});
			}
		},

		afterAuthenticated: function() {
		},

		fixPagingAndAggregateSameQueriesOfFhirModel: function () {

			FHIRModel.prototype._createRequestInfo = function (sMethod, sUrl) {
				const oRequestInfo = {
					method: sMethod,
					url: sUrl
				};
				if (sMethod === "DELETE" && !sUrl.includes("Practitioner")) {
					oRequestInfo.url += "?_cascade=delete";
				}
				return oRequestInfo;
			};
			// Copied from: https://github.com/SAP/openui5-fhir/blob/v2.2.8/src/sap/fhir/model/r4/FHIRListBinding.js#L180
			// Directly use sNextLink
			FHIRListBinding.prototype.getContexts = function (iStartIndex, iLength) {
				if (!this.iLength && iLength !== undefined) {
					this.iLength = iLength > this.oModel.iSizeLimit ? this.oModel.iSizeLimit : iLength;
				} else if (!this.iLength) {
					this.iLength = this.oModel.iSizeLimit;
				}

				var mParameters = this._buildParameters(this.iLength);
				var fnSuccess = function (oData) {
					if (oData.total === undefined) {
						throw new Error("FHIR Server error: The \"total\" property is missing in the response for the requested FHIR resource " + this.sPath);
					}
					this.bDirectCallPending = false;
					if (!this.aKeys) {
						this.aKeys = [];
						iStartIndex = 0;
					} else {
						iStartIndex = this.aKeys.length;
					}
					if (oData.entry && oData.entry.length) {
						var oResource;
						var oBindingInfo = this.oModel.getBindingInfo(this.sPath, this.oContext, this.bUnique);
						var sBindingResType = oBindingInfo.getResourceType();
						for (var i = 0; i < oData.entry.length; i++) {
							oResource = oData.entry[i].resource;
							oBindingInfo = this.oModel.getBindingInfo(this.sPath, this.oContext, this.bUnique, oResource);
							if (oResource.resourceType === sBindingResType) {
								this.aKeys[iStartIndex + i] = oBindingInfo.getAbsolutePath().substring(1);
							}
						}
					}
					this._markSuccessRequest(oData, oData.total);
				}.bind(this);

				var fnSuccessValueSet = function (oData) {
					var iTotal = oData.expansion.total || (oData.expansion.contains && oData.expansion.contains.length) || 0;
					this._buildKeys("ValueSet/" + "§" + oData.expansion.identifier + "§", oData.expansion.contains, iTotal);
					this._markSuccessRequest(oData, iTotal);
				}.bind(this);

				var fnLoadResources = function () {
					var sValueSetUri = this._getValueSetUriFromStructureDefinition();
					if (sValueSetUri) {
						this._submitRequest("/ValueSet/$expand", {
							urlParameters: {
								url: sValueSetUri,
								displayLanguage: sap.ui.getCore().getConfiguration().getLanguage()
							}
						}, fnSuccessValueSet);
					} else {
						this._loadResources(iLength);
					}
				}.bind(this);

				var fnSuccessStructDef = function (oData) {
					this.bDirectCallPending = false;
					if (oData && oData.entry) {
						this.oStructureDefinition = oData.entry[0].resource;
						fnLoadResources();
					} else {
						this.bPendingRequest = false;
						this.bInitial = false;
						var oBindingInfo = this.oModel.getBindingInfo(this.sPath, this.oContext, this.bUnique);
						var oResource = this.oModel.getProperty(oBindingInfo.getResourcePath()) || {};
						oResource.resourceType = oResource.resourceType || oBindingInfo.getResourceType();
						var sStrucDefUrl = this.oModel.getStructureDefinitionUrl(oResource);
						throw new Error("The structuredefinition " + sStrucDefUrl + " could not be loaded from the server for binding with path " + oBindingInfo.getRelativePath());
					}
				}.bind(this);

				if (!this.bPendingRequest && !this.bResourceNotAvailable) {
					if (this._isValueSetHardCoded() && this.iTotalLength === undefined) { // load hardcoded valueset
						mParameters.urlParameters.displayLanguage = sap.ui.getCore().getConfiguration().getLanguage();
						this._submitRequest("/ValueSet/$expand", mParameters, fnSuccessValueSet);
					} else if (!this.aSortersCache && !this.aFilterCache && this.sNextLink && iLength > this.iLastLength) {
						this.iLastLength += this.iLength;
						// the direct next links will not be used by default to send the request
						// instead its converted into the necessary parameters and path before sending
						// this is to address the if the service url is relative
						if (this.sNextLink && this.sNextLink.indexOf("?") > -1) {
							var sQueryParams = this.sNextLink.substring(this.sNextLink.indexOf("?") + 1, this.sNextLink.length);
							var aParameter = sQueryParams ? sQueryParams.split("&") : [];
							var aKeyValue;
							for (var i = 0; i < aParameter.length; i++) {
								aKeyValue = aParameter[i].split("=");
								mParameters.urlParameters[aKeyValue[0]] = aKeyValue[1];
							}
							// this._submitRequest(this.sPath, mParameters, fnSuccess, true);
							// MEDU-108 do not use the resource for
							this._submitRequest("?" + sQueryParams, undefined, fnSuccess, true);
						} else {
							this._submitRequest(this.sNextLink, undefined, fnSuccess, true);
						}
					} else if (this.iTotalLength === undefined) { // load context based resources
						this.iLastLength = this.iLength;
						this._loadProfile(fnSuccessStructDef, fnLoadResources, fnSuccess, mParameters, iLength);
					} else if (!this._isValueSet()) {
						if (iLength > this.iLastLength) {
							this.iLastLength += this.iLength;
						}
						if (!this.iLastLength) {
							this.iLastLength = this.iLength;
						}
						this._loadResources(this.iLastLength);
					}
				}

				this._buildContexts(iLength);
				return this.aContexts;
			};

			FHIRRequestor.prototype._request = function(sMethod, sPath, bForceDirectCall, mParameters, sGroupId, mHeaders, oPayload, fnSuccess, fnError, oBinding, bManualSubmit) {
				if (!FHIRUtils.isRequestable(sPath) && !bForceDirectCall){
					return undefined;
				}
				var oRequestHandle;
				// it's a bundle (Batch or Transaction)
				if (!bForceDirectCall && this._getGroupSubmitMode(sGroupId) !== SubmitMode.Direct) {
					var oFHIRBundle = this._getBundleByGroup(sGroupId);
					var oUri = this._getGroupUri(sGroupId);
					
					var oFHIRBundleEntry = this._createBundleEntry(sMethod, sPath, mParameters, oPayload, fnSuccess, fnError, oBinding, oUri);

					let bFound = false;
					if(sMethod === "GET") {
						// try to find if there is already a request for this resource
						var aBundleEntriesData = [];
						for (var i = 0; i < oFHIRBundle._aBundleEntries.length; i++) {
							const oFHIRBundleEntryInQueue = oFHIRBundle._aBundleEntries[i];
							if(oFHIRBundleEntryInQueue.getRequest()._sMethod === "GET" && oFHIRBundleEntryInQueue.getRequest()._sUrl === oFHIRBundleEntry.getRequest()._sUrl) {
								bFound = true;
								const oldSuccess = oFHIRBundleEntryInQueue.getRequest()._fnSuccess;
								oFHIRBundleEntryInQueue.getRequest()._fnSuccess = function() {
									oldSuccess.apply(this, arguments);
									oFHIRBundleEntry.getRequest().executeSuccessCallback.apply(oFHIRBundleEntry.getRequest(), arguments);
								}
							}
						}
					}
					if(!bFound) {
						oFHIRBundle.addBundleEntry(oFHIRBundleEntry);
					}
					if (bManualSubmit){
						this._mBundleQueue[sGroupId] = oFHIRBundle;
						return oFHIRBundle;
					} else {
						oRequestHandle = this._mBundleQueue[sGroupId];
						if (oRequestHandle && oRequestHandle instanceof RequestHandle){
							oRequestHandle.getRequest().abort();
						}
						oRequestHandle = this._sendBundle(oFHIRBundle);
						this._mBundleQueue[sGroupId] = oRequestHandle;
						return oRequestHandle;
					}
				}
		
				// it's a direct call
				oRequestHandle = this._sendRequest(sMethod, sPath, mParameters, mHeaders, sMethod === HTTPMethod.PUT || sMethod == HTTPMethod.POST ? oPayload : undefined, fnSuccess, fnError, oBinding);
				return oRequestHandle;
			};

		},

		/**
		 * Parse a json token payload that is base64 encoded.
		 * 
		 * @param {string} token 
		 * @returns 
		 */
		parseJwt: function (token) {
			var base64Url = token.split('.')[1];
			var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));

			return JSON.parse(jsonPayload);
		},

		/**
		 * Returns an instance of the semantic helper
		 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
		 */
		getHelper: function () {
			const oFCL = this.getRootControl().byId("fcl"),
				oParams = jQuery.sap.getUriParameters(),
				oSettings = {
					defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded,
					mode: oParams.get("mode"),
					initialColumnsCount: oParams.get("initial"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		}
	});

});
