/*!
 * SAP SE
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/model/Model","sap/fhir/model/r4/FHIRListBinding","sap/fhir/model/r4/FHIRPropertyBinding","sap/fhir/model/r4/FHIRContextBinding","sap/fhir/model/r4/FHIRTreeBinding","sap/fhir/model/r4/FHIRUtils","sap/fhir/model/r4/OperationMode","sap/ui/thirdparty/URI","sap/fhir/model/r4/lib/BindingInfo","sap/fhir/model/r4/lib/Sliceable","sap/fhir/model/r4/SubmitMode","sap/fhir/model/r4/lib/FHIRRequestor","sap/fhir/model/r4/lib/HTTPMethod","sap/fhir/model/r4/lib/FHIRBundle","sap/ui/model/ChangeReason","sap/fhir/model/r4/lib/FHIRUrl","sap/base/Log","sap/base/util/deepEqual","sap/base/util/each","sap/fhir/model/r4/Context","sap/ui/core/message/Message","sap/ui/core/library","sap/fhir/model/r4/FHIRFilterProcessor","sap/fhir/model/r4/FHIRFilterOperator","sap/fhir/model/r4/type/Url","sap/fhir/model/r4/type/Uuid"],function(e,t,r,s,i,o,a,n,u,p,h,l,d,f,c,g,v,y,m,R,P,b,_,T,U,S){"use strict";var I=b.MessageType;var C=e.extend("sap.fhir.model.r4.FHIRModel",{constructor:function(t,r){e.apply(this);if(!t){throw new Error("Missing service root URL")}t=t.slice(-1)==="/"?t.slice(0,-1):t;this.oServiceUrl=new n(t);this.sServiceUrl=this.oServiceUrl.query("").toString();this._setupData();this.aCallAfterUpdate=[];this.sDefaultOperationMode=a.Server;this.sBaseProfileUrl=r&&r.baseProfileUrl?r.baseProfileUrl:"http://hl7.org/fhir/StructureDefinition/";this._buildGroupProperties(r);this.oDefaultQueryParameters=r&&r.defaultQueryParameters&&r.defaultQueryParameters instanceof Object?r.defaultQueryParameters:{};this.bSecureSearch=r&&r.search&&r.search.secure?r.search.secure:false;this.oRequestor=new l(t,this,r&&r["x-csrf-token"],r&&r.Prefer,this.oDefaultQueryParameters);this.sDefaultSubmitMode=r&&r.defaultSubmitMode?r.defaultSubmitMode:h.Direct;this.sDefaultFullUrlType=r&&r.defaultSubmitMode&&r.defaultSubmitMode!==h.Direct&&r.defaultFullUrlType?r.defaultFullUrlType:"uuid";this.oDefaultUri=this.sDefaultFullUrlType==="url"?new U:new S;this.iSizeLimit=10;if(r&&r.filtering&&r.filtering.complex===true){this.iSupportedFilterDepth=undefined}else{this.iSupportedFilterDepth=2}},metadata:{publicMethods:[]}});C.prototype._setupData=function(){this.oData={};this.oDataServerState={};this.mChangedResources={};this.mOrderResources={};this.mResourceGroupId={};this.mContexts={};this.mMessages={};this.mRemovedResources={}};C.prototype.getBaseProfileUrl=function(){return this.sBaseProfileUrl};C.prototype.getServiceUrl=function(){return this.sServiceUrl};C.prototype.bindList=function(e,r,s,i,o){var a=new t(this,e,r,s,i,o);return a};C.prototype.bindProperty=function(e,t,s){var i=new r(this,e,t,s);return i};C.prototype.bindTree=function(e,t,r,s,o){var a=new i(this,e,t,r,s,o);return a};C.prototype.bindContext=function(e,t,r){var i=new s(this,e,t,r);return i};C.prototype._mapFHIRResponse=function(e,t,r,s,i){if(e.entry&&e.resourceType==="Bundle"){for(var o=0;o<e.entry.length;o++){var a=e.entry[o].resource;if(a&&a.resourceType==="Bundle"){this._mapFHIRResponse(a,t,r,i)}else if(!a&&e.entry[o].response){this._updateResourceFromFHIRResponse(e.entry[o].response,e.entry[o].fullUrl,r)}else{this._storeResourceInModel(a,s,i)}}}else if(e.resourceType!=="Bundle"){this._storeResourceInModel(e,s,i)}};C.prototype._storeResourceInModel=function(e,t,r){var s;if(e.resourceType==="ValueSet"&&e.expansion&&e.expansion.identifier){s=[e.resourceType,"§"+e.expansion.identifier+"§"];e=e.expansion.contains}else{if(!e.id){e.id=o.uuidv4()}s=[e.resourceType,e.id];var i=["$_history",e.resourceType,e.id];if(e.meta&&e.meta.versionId){i.push(e.meta.versionId)}if(t){var a=this.getBindingInfo(t.sPath,t.oContext,t.mParameters&&t.mParameters.unique,e);s=a.getBinding()}this._setProperty(this.mResourceGroupId,o.deepClone(s),r,true);this._setProperty(this.oData,i,e,true)}this._setProperty(this.oData,s,e,true)};C.prototype._getUpdatedResourceFromFHIRResponse=function(e,t){if(e.location&&e.location.charAt(0)==="/"){e.location=e.location.slice(1)}var r=this.getBindingInfo("/"+e.location);var s;if(t){s=t.getResource()}else{s=this._getProperty(this.oData,[r.getResourceType(),r.getResourceId()])}s.id=r.getResourceId();return s};C.prototype._updateResourceFromFHIRResponse=function(e,t,r){var s=this._getUpdatedResourceFromFHIRResponse(e,r);this._setProperty(s,["meta","versionId"],e.etag);this._setProperty(s,["meta","lastUpdated"],e.lastModified);return s};C.prototype._mapBundleEntriesToResourceMap=function(e){var t={};for(var r=0;r<e.length;r++){var s;if(!e[r]){throw new Error("No response from the FHIR Service available")}if(!e[r].resource&&e[r].response){s=this._getUpdatedResourceFromFHIRResponse(e[r].response)}else{s=e[r].resource}if(s&&s.resourceType=="Bundle"&&s.entry){t=this._mapBundleEntriesToResourceMap(s.entry)}else if(s&&s.resourceType&&s.id){this._setProperty(t,[s.resourceType,s.id],s,true)}else{throw new Error("No resource could be found for bundle entry: "+e[r])}}return t};C.prototype._mapResourceToResourceMap=function(e){var t={};if(e&&e.resourceType==="ValueSet"&&e.expansion&&e.expansion.identifier){this._setProperty(t,["ValueSet","§"+e.expansion.identifier+"§"],e.expansion.contains,true)}else if(e&&e.resourceType&&e.id&&e.resourceType!=="Bundle"){this._setProperty(t,[e.resourceType,e.id],e,true)}else if(!e){throw new Error("No data could be found which should be mapped as updated resource")}return t};C.prototype._onSuccessfulRequest=function(e,t,r,s,i,a,n){var u;var p;var h;var l;if(r){l=r.getRequest().getBinding();u=r.getRequest().getUrl();h=e.getBundle().getGroupId();if(t.resource&&d.GET===a){t=t.resource}else if(d.DELETE!==a){p=t.response;t=this._updateResourceFromFHIRResponse(p,r.getFullUrl(),r)}}else{u=e.getUrl();p=this.oRequestor.getResponseHeaders(e.getRequest());l=e.getBinding()}if(s){s(t)}if(a!==d.HEAD){var f;if(a===d.DELETE){f=new g(u,this.sServiceUrl);t=o.deepClone(this.oData[f.getResourceType()][f.getResourceId()]);delete this.oData[f.getResourceType()][f.getResourceId()]}else if(!t){t=JSON.parse(e.getData());f=new g(p.location,this.sServiceUrl);t.id=f.getResourceId();t.meta={};t.meta.versionId=f.getHistoryVersion();t.meta.lastUpdated=p["last-modified"];this.oData[t.resourceType][t.id]=t}else{this._mapFHIRResponse(t,p,r,l,h)}var c=t.entry?this._mapBundleEntriesToResourceMap(t.entry):this._mapResourceToResourceMap(t);this.checkUpdate(false,c,l,a)}if(i){i(t)}};C.prototype._processError=function(e,t,r,s,i,o,a){var n=this._publishMessage(e,t,r,s,a);v.fatal(o+" "+n.getDescriptionUrl()+", Statuscode: "+n.getCode()+"\nError message: "+n.getMessage());if(i){i(n)}};C.prototype._publishMessage=function(e,t,r,s,i){var o;if(r&&t){var a=parseInt(t.response.status.substring(0,3),10);o={message:t.response.status.substring(4),description:JSON.stringify(t.response),code:a,descriptionUrl:r.getRequest().getUrl(),binding:s,additionalText:a}}else{o={message:e.getRequest().statusText,description:e.getRequest().responseText,code:e.getRequest().status,descriptionUrl:e.getUrl(),binding:s,additionalText:e.getRequest().status}}o.type=I.Error;if(i){o.message=i.message;o.additionalText=i.stack}var n=new P(o);if((!this.mMessages[n.descriptionUrl]||!s)&&n.code){this.mMessages[n.descriptionUrl]=n;this.fireMessageChange({newMessages:n})}return n};C.prototype.loadData=function(e,t,r,s){r=r||d.GET;if(!t){t={}}var i=t.binding;var o=t.groupId||i&&i.sGroupId;var a=function(e,s,o){if(!s){s=e.getRequest().responseJSON}try{this._onSuccessfulRequest(e,s,o,t.successBeforeMapping,t.success,r,t.urlParameters);var a=o?o.getRequest().getUrl():e.getUrl();if(this.mMessages[a]){this.fireMessageChange({oldMessages:this.mMessages[a]});delete this.mMessages[a]}}catch(a){this._processError(e,s,o,i,t.error,r,a)}}.bind(this);var n=function(e,s,o){this._processError(e,s,o,i,t.error,r)}.bind(this);var u=this.oRequestor._request(r,e,t.forceDirectCall,t.urlParameters,o,t.headers,s,a,n,i,t.manualSubmit);return u};C.prototype.submitChanges=function(e,t,r){if(typeof e==="function"){r=t;t=o.deepClone(e);e=undefined}var s=function(e){if(r){r(e)}};var i=function(){this.resetChanges(e,true)}.bind(this);var a;var n=[];var u=0;var p=function(){var e={};var s=function(t){e.resolve(t)};var i=function(t,r,s){var i={};i.requestHandle=t;i.resources=r;i.operationOutcomes=s;e.reject(i)};for(var o in a){if(o!=="direct"){var u=new Promise(function(t,r){e.resolve=t;e.reject=r});n.push(u);u.then(function(e){t(e)}).catch(function(e){if(r&&e.requestHandle){var t={message:e.requestHandle.getRequest().statusText,description:e.requestHandle.getRequest().responseText,code:e.requestHandle.getRequest().status,descriptionUrl:e.requestHandle.getUrl()};var s=new P(t);r(s,e.resources,e.operationOutcomes)}});a[o]=this.oRequestor.submitBundle(o,s,i)}}}.bind(this);var h;var l=function(){var r=0;var o=h.getResourcePathArray();var n=this._getProperty(this.oData,o);var l=this._getProperty(this.mResourceGroupId,o);var c;if(e&&l===e){c=true}else if(!e){c=true}else{c=false}if(c){var g=this._getProperty(this.oDataServerState,o);var v=this._getProperty(this.mChangedResources,o);if(!y(n,g)||v&&v.method===d.DELETE){var m;var R=function(){var r={successBeforeMapping:i,success:t,error:s,headers:m,groupId:l,manualSubmit:true};if(e&&l===e&&this.getGroupSubmitMode(e)!=="Direct"){r.success=function(){};r.error=function(){}}var o=this.loadData(v.url,r,v.method,n);a=a?a:{};if(o instanceof f&&!a[o.getGroupId()]){a[o.getGroupId()]={}}else if(!a.direct){a.direct=[];a.direct.push(o)}else{a.direct.push(o)}}.bind(this);var P=function(e){r++;m={"If-Match":e};R();if(u===r){p()}};if(v.method===d.PUT){var b=h.getETag();if(!b){this.readLatestVersionOfResource(h.getResourceServerPath(),P);u++}else{m={"If-Match":b};R()}}else{R()}}}}.bind(this);for(var c in this.mChangedResources){for(var g in this.mChangedResources[c]){if(c==="$_history"){for(var v in this.mChangedResources[c][g]){for(var m in this.mChangedResources[c][g][v]){h=this.getBindingInfo("/"+c+"/"+g+"/"+v+"/"+m);l()}}}else{h=this.getBindingInfo("/"+c+"/"+g);l()}}}if(u===0){p()}return a};C.prototype.checkUpdate=function(e,t,r,s){var i=this.aBindings.slice(0);m(i,function(r,i){i.checkUpdate(e,t,s)});this._processAfterUpdate()};C.prototype.attachAfterUpdate=function(e){this.aCallAfterUpdate.push(e)};C.prototype._processAfterUpdate=function(){var e=this.aCallAfterUpdate;this.aCallAfterUpdate=[];for(var t=0;t<e.length;t++){e[t]()}};C.prototype.refresh=function(){this._setupData();for(var e=0;e<this.aBindings.length;e++){this.aBindings[e].refresh(c.Refresh)}};C.prototype.getProperty=function(e,t,r){var s=this.oData;if(r){s=r}var i=this.getBindingInfo(e,t);if(i){return this._getProperty(s,i.getBinding())}return undefined};C.prototype._getProperty=function(e,t){t=o.deepClone(t);if(!e){return undefined}var r;var s;if(t.length===1){if(p.containsSliceable(t[0])){s=p.getSliceables(t[0]);return this._findMatchingSlice(e,s)}else{return e[t[0]]}}var i;var a=t.shift();if(a==="reference"&&e.reference&&typeof e.reference==="string"){r=o.splitPath(e.reference);i=this.oData[r[0]][r[1]]}else if(p.containsSliceable(a)){s=p.getSliceables(a);i=this._findMatchingSlice(e,s,false);var n=i&&Object.keys(i);if(n&&!isNaN(n[0])){a=t.shift();i=e[a]}}else{i=e[a]}return this._getProperty(i,t)};C.prototype._handleClientChanges=function(e,t){if(!t){t=e.getGroupId()}var r=e.getResourcePathArray();var s=this._getProperty(this.oDataServerState,r);var i=this._getProperty(this.mChangedResources,r);var a=this._getProperty(this.oData,r);if(!i&&a){i=this._createRequestInfo(d.PUT,e.getResourceServerPath());this._setProperty(this.mChangedResources,o.deepClone(r),i,true)}else if(!i){i=this._createRequestInfo(d.POST,e.getResourceType());this._setProperty(this.mChangedResources,o.deepClone(r),i,true)}if(t){this._setProperty(this.mResourceGroupId,o.deepClone(r),t,true)}if(!this._isServerStateUpToDate(s,a,i.method)){this._setProperty(this.oDataServerState,r,o.deepClone(a),true)}};C.prototype.setProperty=function(e,t,r,s){var i=this.getBindingInfo(e,r);this._handleClientChanges(i);this._setProperty(this.oData,i.getBinding(),t,undefined,i.getGroupId());var o=i.getResourcePathArray();var a=this._getProperty(this.oDataServerState,o);var n=this._getProperty(this.mChangedResources,o);var u=this._getProperty(this.oData,o);if(n&&n.method===d.PUT&&y(a,u)){delete this.mChangedResources[o[0]][o[1]]}else{this.mChangedResources.path={lastUpdated:i.getAbsolutePath()}}this.checkUpdate(false,this.mChangedResources,s)};C.prototype._setProperty=function(e,t,r,s,i,a){if(a===undefined){a=0}var n;var u;var h=t[a];var l;if(h==="reference"&&t.length-1!==a){u=o.splitPath(e[h]);var d=this.getBindingInfo("/"+e[h]);this._handleClientChanges(d,i);n=this.oData[u[0]][u[1]]}else if(t.length-1===a){if(r){e[h]=r}else{delete e[h]}return}else if(p.containsSliceable(h)){l=t[a+1];if(!isNaN(l)){a++;n=e[l]}else{var f=p.getSliceables(h);n=this._findMatchingSlice(e,f);if(!n){n={};for(var c in f){var g=f[c];if(g.aFilters){for(var v=0;v<g.aFilters.length;v++){this._setProperty(n,o.splitPath(g.aFilters[v].sPath),g.aFilters[v].oValue1)}}else{this._setProperty(n,o.splitPath(g.sPath),g.oValue1)}}e.push(n)}}}else if(!e.hasOwnProperty(h)){l=t[a+1];if(s||isNaN(l)&&!p.containsSliceable(l)){e[h]={}}else{e[h]=[]}}this._setProperty(n||e[h],t,r,s,i,a+1)};C.prototype._createRequestInfo=function(e,t){return{method:e,url:t}};C.prototype._resolvePath=function(e,t){if(t&&(!e||e&&!e.startsWith("/"))){var r=t.sPath;var s=t.getBinding().getContext();var i=e?"/"+e:"";return this._resolvePath(r,s)+i}else if(e&&e.startsWith("/")){return e}else{return undefined}};C.prototype.getBindingInfo=function(e,t,r,s){var i=this._resolvePath(e,t);if(i){var a=o.splitPath(i);var n;var p;var h;var l;var d;var f;var c;var g;var v;var y;var m=t&&t.sGroupId;var R="";if(i.indexOf("_history")>-1||r){if(s){h=s.resourceType;p=s.id;f=this._getProperty(s,["meta","versionId"])}else if(i.startsWith("/$")){h=a[2];p=a[3];f=a[4]}else{h=a[1];p=a[2];f=a[4]}if(f){f="/"+f}else{f=""}d=a.slice(5).join("/");g="/"+h+"/"+p+"/_history"+f;l="/$_history"+"/"+h+"/"+p+f;if(d){c=l+"/"+d}else{c=l}}else if(s){h=s.resourceType;p=s.id;l="/"+h+"/"+p;c=l}else{R=this.determineOperation(i);h=a[1];if(a[2]&&a[2]!==R){p=a[2];l="/"+a[1]+"/"+a[2];d=a.slice(3).join("/")}if(R){c=i.replace(R,"");d=d.replace(R.substring(1)+"/","")}}if(c){a=o.splitPath(c);i=c}if(!g){g=(l||h||"")+R}if(l){n=o.splitPath(l).slice(1)}if(h&&p){v="/"+h+"/"+p;y=this._getProperty(this.oData,[h,p,"meta","versionId"]);if(y){y='W/"'+y+'"'}}return new u(p,h,l,d,i,a.slice(1),m,g,n,v,y)}return undefined};C.prototype.determineOperation=function(e){var t="";var r=e.indexOf("$");if(r>-1&&r!==1){var s=e.substring(r);var i=s.indexOf("/");if(i>-1){t="/"+s.substring(0,i)}else{t="/"+s}}return t};C.prototype._findMatchingSlice=function(e,t,r){var s={};var i;var a=function(e,t){return this._getProperty(e,o.splitPath(t))}.bind(this);for(var n in t){if(t[n].sPath&&t[n].sPath.startsWith("revreference/")){var u=t[n].sPath.substring(13);if(r!==false){var p=o.splitPath(t[n].oValue1);for(var h in this.oData[u]){var l=this._getProperty(this.oData[u][h],p);if(l===e.resourceType+"/"+e.id){s[u+"/"+h]=this.oData[u][h]}}return s}else{return this.oData}}else{for(var d=0;d<e.length;d++){i=e[d];if(_._evaluateFilter(t[n],i,a)){s[d]=i}}}}var f=Object.keys(s);s=f.length===0?undefined:s;return f.length===1?s[f[0]]:s};C.prototype.hasResourceTypePendingChanges=function(e){return this.mChangedResources[e]!==undefined&&Object.keys(this.mChangedResources[e]).length>0};C.prototype.destroy=function(){this.oRequestor.destroy();this.aCallAfterUpdate=[];this.mChangedResources={};e.prototype.destroy.apply(this,arguments)};C.prototype.getGroupProperty=function(e,t){switch(t){case"submit":return this.getGroupSubmitMode(e);case"uri":return this.getGroupUri(e);default:throw new Error("Unsupported group property: "+t)}};C.prototype.getGroupSubmitMode=function(e){return this.mGroupProperties&&this.mGroupProperties[e]&&this.mGroupProperties[e].submit||this.sDefaultSubmitMode};C.prototype.getGroupUri=function(e){var t=this.oDefaultUri;if(this.mGroupProperties&&this.mGroupProperties[e]&&this.mGroupProperties[e].fullUrlType==="url"){t=new U}return t};C.prototype._buildGroupProperties=function(e){if(e){var t;for(var r in e.groupProperties){t=e.groupProperties[r];if(typeof t!=="object"){throw new Error('Group "'+r+'" has invalid properties. The properties must be of type object, found "'+t+'"')}else if(Object.keys(t).length===2&&(!t.submit||!t.fullUrlType)){throw new Error('Group "'+r+'" has invalid properties. Only the property "submit" and "fullUrlType" is allowed and has to be set, found "'+JSON.stringify(t)+'"')}else if(Object.keys(t).length===1&&!t.submit&&t.fullUrlType){throw new Error('Group "'+r+'" has invalid properties. The property "fullUrlType" is allowed only when submit property is present, found "'+JSON.stringify(t)+'"')}else if(Object.keys(t).length===1&&!t.submit){throw new Error('Group "'+r+'" has invalid properties. Only the property "submit" is allowed and has to be set, found "'+JSON.stringify(t)+'"')}else if(t.submit&&!(t.submit in h)){throw new Error('Group "'+r+'" has invalid properties. The value of property "submit" must be of type sap.fhir.model.r4.SubmitMode, found: "'+t.submit+'"')}else if(t.fullUrlType&&(t.fullUrlType!=="uuid"&&t.fullUrlType!=="url")){throw new Error('Group "'+r+'" has invalid properties. The value of property "fullUrlType" must be either uuid or url, found: "'+t.fullUrlType+'"')}else if(t.submit&&(t.submit!==h.Batch&&t.submit!==h.Transaction)&&t.fullUrlType){throw new Error('Group "'+r+'" has invalid properties. The value of property "fullUrlType" is applicable only for batch and transaction submit modes, found: "'+t.submit+'"')}}this.mGroupProperties=e.groupProperties}else{v.info("no parameters are defined to build group properties")}};C.prototype.sendGetRequest=function(e,t){return this.loadData(e,t)};C.prototype.sendPostRequest=function(e,t,r){var s=t&&t.type&&(t.type=="batch"||t.type=="transaction")?true:false;if(s){r.forceDirectCall=true}return this.loadData(e,r,d.POST,t)};C.prototype.readLatestVersionOfResource=function(e,t){var r;var s=function(e){var s=this.oRequestor.getResponseHeaders(r.getRequest());var i=s?s["etag"]:undefined;var o=s?s["location"]||s["content-location"]:undefined;var a=o?new g(o,this.sServiceUrl):undefined;var n;if(i){n=i}else if(a&&a.getHistoryVersion()){n='W/"'+a.getHistoryVersion()+'"'}else if(e&&e.meta&&e.meta.versionId){n='W/"'+e.meta.versionId+'"'}t(n)}.bind(this);var i={success:s,error:function(){r.getRequest().complete(function(){i={success:s};r=this.loadData(e,i,d.GET)}.bind(this))}.bind(this)};r=this.loadData(e,i,d.HEAD)};C.prototype.create=function(e,t,r){var s=o.uuidv4();var i="/"+e+"/"+s;if(!this.mOrderResources[e]){this.mOrderResources[e]=[i.substring(1)]}else{this.mOrderResources[e].unshift(i.substring(1))}if(!t){t={resourceType:e,id:s}}else{t.resourceType=e;t.id=s}this.setProperty(i,t);if(r){this._setProperty(this.mResourceGroupId,[e,s],r,true)}return s};C.prototype.remove=function(e,t,r){for(var s=0;s<e.length;s++){var i=t?t(e[s]):e[s];var a=this.getBindingInfo(i);var n=a.getResourcePathArray();var u=this._getProperty(this.mChangedResources,n);var p=this._getProperty(this.mResourceGroupId,n);if(u&&u.method==d.POST){this._setProperty(this.oData,o.deepClone(n));this._setProperty(this.mResourceGroupId,o.deepClone(n));this._setProperty(this.mChangedResources,o.deepClone(n));this._removeFromOrderResources(a);this.checkUpdate(true)}else{u=this._createRequestInfo(d.DELETE,a.getResourceServerPath());this._setProperty(this.mChangedResources,o.deepClone(n),u,true,p&&p===r?r:undefined);this._addToRemovedResources(a,i);this.checkUpdate(true,this.mChangedResources,a,d.DELETE)}}};C.prototype._addToRemovedResources=function(e,t){if(!this.mRemovedResources[e.getResourceType()]){this.mRemovedResources[e.getResourceType()]=[t.substring(1)]}else{this.mRemovedResources[e.getResourceType()].unshift(t.substring(1))}};C.prototype.resetChanges=function(e,t){var r;var s=function(){var t=r.getResourcePathArray();var s=this._getProperty(this.mResourceGroupId,t);var i=function(){var e=this._getProperty(this.mChangedResources,t);if(e.method===d.PUT){var s=this._getProperty(this.oDataServerState,t);this._setProperty(this.oData,o.deepClone(t),s)}else if(e.method===d.POST){this._setProperty(this.oData,o.deepClone(t));this._setProperty(this.mResourceGroupId,o.deepClone(t));this._removeFromOrderResources(r)}else if(e.method===d.DELETE){this._removeFromRemovedResources(r)}this._setProperty(this.mChangedResources,o.deepClone(t))}.bind(this);if(s===e){i()}else if(!e){i()}}.bind(this);for(var i in this.mChangedResources){for(var a in this.mChangedResources[i]){if(i==="$_history"){for(var n in this.mChangedResources[i][a]){for(var u in this.mChangedResources[i][a][n]){r=this.getBindingInfo("/"+i+"/"+a+"/"+n+"/"+u);s()}}}else{r=this.getBindingInfo("/"+i+"/"+a);s()}}}if(!t){this.checkUpdate(true)}};C.prototype._removeFromOrderResources=function(e){var t=e.getResourceType();var r=e.getResourceId();var s=this.mOrderResources[t].indexOf(t+"/"+r);this.mOrderResources[t].splice(s,1);if(this.mOrderResources[t].length===0){delete this.mOrderResources[t]}};C.prototype._removeFromRemovedResources=function(e){var t=e.getResourceType();var r=e.getResourceId();var s=this.mRemovedResources[t].indexOf(t+"/"+r);this.mRemovedResources[t].splice(s,1);if(this.mRemovedResources[t].length===0){delete this.mRemovedResources[t]}};C.prototype.getContext=function(){throw new Error("Unsupported operation: sap.fhir.model.r4.FHIRModel#getContext")};C.prototype.getStructureDefinitionUrl=function(e){var t;if(e&&e.meta&&e.meta.profile&&e.meta.profile.length>0){t=e.meta.profile[0]}else if(e&&e.resourceType){t=this.getBaseProfileUrl()+e.resourceType}return t};C.prototype._isServerStateUpToDate=function(e,t,r){if(!e&&r===d.PUT){return false}else if(e&&r===d.PUT&&y(e,t)){return false}return true};C.prototype.isSecureSearchModeEnabled=function(){return this.bSecureSearch};C.prototype.getNextLink=function(e,t,r){var s=e.substring(e.indexOf("?")+1,e.length);var i=s?s.split("&"):[];var o;for(var a=0;a<i.length;a++){o=i[a].split("=");r.urlParameters[o[0]]=o[1]}return{url:t,parameters:r}};return C});