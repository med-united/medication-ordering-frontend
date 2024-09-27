/*!
 * SAP SE
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/ui/model/ChangeReason","sap/fhir/model/r4/FHIRUtils","sap/ui/model/Context"],function(e,t,i,n){"use strict";var s=n.extend("sap.fhir.model.r4.Context",{constructor:function(e,t,i,s){n.call(this,e,i);this.oBinding=t;this.sGroupId=s}});s.prototype._loadContext=function(e){var n=this.oModel.getBindingInfo(this.sPath,this.oBinding.oContext,this.oBinding.bUnique);if(n&&!this.oBinding.bPendingRequest){var s=this.oModel._getProperty(this.oModel.mChangedResources,n.getBinding().slice(0,2));if(!s||s.method!=="POST"){var o=this.oModel._getProperty(this.oModel.oData,n.getBinding());if(!o||e===t.Refresh){var r=function(t){if(t.message!=="abort"){this._markAsReady(t&&t.total,e)}}.bind(this);var d={binding:this.oBinding,forceDirectCall:false,success:r,error:r};i.addRequestQueryParameters(this.oBinding,d);this.oBinding.bPendingRequest=true;this.oModel.loadData(n.getRequestPath(),d);this.bPendingRequest=true}else{this.oBinding.bIsLoaded=true}}else{this.oBinding.bIsCreatedResource=true}}};s.prototype.getBinding=function(){return this.oBinding};s.prototype._markAsReady=function(e,i){this.iTotal=e;this.oBinding.bInitial=false;this.oBinding.bPendingRequest=false;this.oBinding._fireChange({reason:i||t.Change})};s.prototype.refresh=function(e){this.oBinding.bInitial=true;this._loadContext(t.Refresh)};s.create=function(e,t,i,n){if(e.mContexts.hasOwnProperty(i)&&!e.mContexts[i].hasOwnProperty(t.sId)){e.mContexts[i][t.sId]=new s(e,t,i,n)}else if(!e.mContexts.hasOwnProperty(i)){e.mContexts[i]={};e.mContexts[i][t.sId]=new s(e,t,i,n)}return e.mContexts[i][t.sId]};return s});