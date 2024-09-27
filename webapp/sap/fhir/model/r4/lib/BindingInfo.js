/*!
 * SAP SE
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var t=function(t,e,r,s,o,i,u,n,h,a,p){this._sResourceId=t;this._sResourceType=e;this._sResourcePath=r;this._sRelativePath=s;this._sAbsolutePath=o;this._sGroupId=u;this._sRequestPath=n;this._aResourcePath=h;this._sResourceServerPath=a;this._sETag=p;if(i.indexOf("")>-1){throw new Error("Invalid property binding path")}this._aBinding=i};t.prototype.getResourceId=function(){return this._sResourceId};t.prototype.getResourceType=function(){return this._sResourceType};t.prototype.getResourcePath=function(){return this._sResourcePath};t.prototype.getRelativePath=function(){return this._sRelativePath};t.prototype.getAbsolutePath=function(){return this._sAbsolutePath};t.prototype.getGroupId=function(){return this._sGroupId};t.prototype.getBinding=function(){return this._aBinding};t.prototype.getRequestPath=function(){return this._sRequestPath};t.prototype.getResourcePathArray=function(){return this._aResourcePath};t.prototype.getResourceServerPath=function(){return this._sResourceServerPath};t.prototype.getETag=function(){return this._sETag};return t});