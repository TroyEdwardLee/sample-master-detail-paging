/*global location */
sap.ui.define([
	"sample/master/detail/sample-master-detail-paging/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sample/master/detail/sample-master-detail-paging/model/formatter",
	"sap/m/Button",
	"sap/m/ResponsivePopover",
	"sap/m/library",
	"sap/ui/Device"
], function(BaseController, JSONModel, formatter, Button, ResponsivePopover, MobileLibrary, Device) {
	"use strict";

	return BaseController.extend("sample.master.detail.sample-master-detail-paging.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				bConfirmState: true
			});
			this.setModel(oViewModel, "detailView");
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		initSampleDataModel: function() {
			var oModel = new JSONModel();
			jQuery.ajax(jQuery.sap.getModulePath("sample.master.detail.sample-master-detail-paging", "/model/ProcessFlowLanesAndNodes.json"), {
				dataType: "json",
				success: function(oData) {
					oModel.setData(oData);
				},
				error: function() {
					jQuery.sap.log.error("failed to load json");
				}
			});
			return oModel;
		},

		handleNodePress: function(oEvent) {
			var oSelectedNode = oEvent.getParameters(),
				sStatePath = oSelectedNode.getBindingInfo("state").binding.getContext().getPath() + "/" + oSelectedNode.getBindingPath("state"),
				sStateTextPath = oSelectedNode.getBindingInfo("stateText").binding.getContext().getPath() + "/" + oSelectedNode.getBindingPath(
					"stateText");
			var sState = this.oView.getModel("ProcessFlowModel").getProperty(sStatePath);
			this.oView.getModel("detailView").setProperty("/bConfirmState", sState === "Positive" ? true : false);
			var oResponsivePopover;
			var oCheckBox = new sap.m.CheckBox(this.createId("idConfirmStateCheckBox"), {
				text: "确认状态",
				selected: "{detailView>/bConfirmState}",
				select: function(oEvent) {
					this._fnConfirmStateCheckBoxSelect(sStatePath, sStateTextPath);
				}.bind(this)
			}).addStyleClass("sapUiTinyMargin");
			var oEndButton = new Button({
				text: "Action2",
				type: MobileLibrary.ButtonType.Accept,
				press: function() {
					oResponsivePopover.setShowCloseButton(true);
				}
			});
			oResponsivePopover = sap.ui.getCore().byId("__popover") || new ResponsivePopover("__popover", {
				placement: MobileLibrary.PlacementType.Auto,
				title: "确认状态",
				content: [oCheckBox],
				showCloseButton: false,
				afterClose: function() {
					oResponsivePopover.destroy();
				}.bind(this),
				endButton: oEndButton
			});
			if (Device.system.phone) {
				oResponsivePopover.setShowCloseButton(true);
			}
			oResponsivePopover.openBy(oSelectedNode);
			sap.m.MessageToast.show("Node " + oEvent.getParameters().getNodeId() + " and BindingPath " + oEvent.getParameters().getBindingInfo(
				"state").binding.getContext().getPath() + " has been clicked.");
		},

		_fnConfirmStateCheckBoxSelect: function(sStatePath, sStateTextPath) {
			var sState = "",
				sStateText = "",
				bConfirmState = this.oView.getModel("detailView").getProperty("/bConfirmState");
			if (bConfirmState) {
				sState = "Positive";
				sStateText = "OK status";
			} else {
				sState = "Negative";
				sStateText = "NOT OK";
			}
			this.oView.getModel("ProcessFlowModel").setProperty(sStatePath, sState);
			this.oView.getModel("ProcessFlowModel").setProperty(sStateTextPath, sStateText);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			this.getModel("detailView").setProperty("/busy", false);
			var oJSONModel = this.initSampleDataModel();
			this.oView.setModel(oJSONModel, "ProcessFlowModel");
			/*var sObjectId =  oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then( function() {
				var sObjectPath = this.getModel().createKey("Order_Details", {
					OrderID :  sObjectId,
					ProductID: "1"
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));*/
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.OrderID,
				sObjectName = oObject.OrderID,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", false);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});