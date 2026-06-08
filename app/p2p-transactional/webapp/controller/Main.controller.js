sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "p2p/common/Auth",
  "p2p/common/Header",
  "p2p/common/RoleAccess"
], function (Controller, JSONModel, MessageToast, MessageBox, Auth, Header, RoleAccess) {
  "use strict";

  return Controller.extend("sap.cap.p2p.transactional.controller.Main", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth("/p2p-transactional/index.html")) {
        return;
      }

      var role = Auth.getSession().role;
      var entity = new URLSearchParams(window.location.search).get("entity") || "InspectionLots";
      var titles = {
        InspectionLots: "Inspection Lots",
        GoodsReceipts: "Goods Receipts",
        Invoices: "Supplier Invoices",
        PaymentRuns: "Payment Runs"
      };

      this.getView().setModel(new JSONModel({
        pageTitle: titles[entity] || "Inspection Lots",
        selectedKey: entity === "GoodsReceipts" ? "gr" : entity === "Invoices" ? "invoice" : entity === "PaymentRuns" ? "payment" : "qc",
        showInspectionLots: entity === "InspectionLots",
        showGoodsReceipts: entity === "GoodsReceipts",
        showInvoices: entity === "Invoices",
        showPaymentRuns: entity === "PaymentRuns"
      }), "page");
      this.getView().setModel(new JSONModel({
        postUsageDecision: RoleAccess.canExecuteAction("postUsageDecision", role),
        postGoodsReceipt: RoleAccess.canExecuteAction("postGoodsReceipt", role),
        runThreeWayMatch: RoleAccess.canExecuteAction("runThreeWayMatch", role),
        createPaymentAdvice: RoleAccess.canExecuteAction("createPaymentAdvice", role),
        executePaymentRun: RoleAccess.canExecuteAction("executePaymentRun", role)
      }), "actions");
      Auth.applyAuthHeader(this.getOwnerComponent().getModel());
      Header.apply(this);
    },

    onSelectInspectionLot: function (event) {
      this._inspectionLotContext = event.getParameter("listItem").getBindingContext();
      this._openObjectPage(event, "InspectionLots");
    },

    onSelectGoodsReceipt: function (event) {
      this._openObjectPage(event, "GoodsReceipts");
    },

    onSelectInvoice: function (event) {
      this._invoiceContext = event.getParameter("listItem").getBindingContext();
      this._openObjectPage(event, "Invoices");
    },

    onSelectPaymentRun: function (event) {
      this._paymentRunContext = event.getParameter("listItem").getBindingContext();
      this._openObjectPage(event, "PaymentRuns");
    },

    onPostUsageDecision: function () {
      if (!this._isActionAllowed("postUsageDecision")) {
        return;
      }
      this._invokeWithContext("/postUsageDecision(...)", "lotId", this._inspectionLotContext, "Usage decision posted");
    },

    onRunThreeWayMatch: function () {
      if (!this._isActionAllowed("runThreeWayMatch")) {
        return;
      }
      this._invokeWithContext("/runThreeWayMatch(...)", "invoiceId", this._invoiceContext, "Three-way match completed");
    },

    onCreatePaymentAdvice: function () {
      if (!this._isActionAllowed("createPaymentAdvice")) {
        return;
      }
      this._invokeWithContext("/createPaymentAdvice(...)", "invoiceId", this._invoiceContext, "Payment advice created");
    },

    onExecutePaymentRun: function () {
      if (!this._isActionAllowed("executePaymentRun")) {
        return;
      }
      this._invokeWithContext("/executePaymentRun(...)", "paymentRunId", this._paymentRunContext, "Payment run executed");
    },

    _isActionAllowed: function (action) {
      if (!RoleAccess.canExecuteAction(action, Auth.getSession().role)) {
        MessageBox.error("You do not have permission to perform this action.");
        return false;
      }

      return true;
    },

    _openObjectPage: async function (event, entity) {
      var item = event.getParameter("listItem");
      var context = item && item.getBindingContext();

      if (!context) {
        MessageBox.error("No selected record found.");
        return;
      }

      var object = await context.requestObject();
      var id = object && object.ID;

      if (!id) {
        MessageBox.error("No selected record found.");
        return;
      }

      window.location.href = "/p2p-object-pages/index.html#/object/" + encodeURIComponent(entity) + "/" + encodeURIComponent(id);
    },

    _invokeWithContext: async function (path, parameterName, context, successText) {
      if (!context) {
        MessageToast.show("Select a row first");
        return;
      }

      try {
        var object = await context.requestObject();
        var binding = this.getView().getModel().bindContext(path);
        binding.setParameter(parameterName, object.ID);
        await binding.invoke("$direct");
        MessageToast.show(successText);
        this.getView().getModel().refresh();
      } catch (error) {
        MessageBox.error(error.message || "Action failed");
      }
    }
  });
});
