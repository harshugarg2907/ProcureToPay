sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("sap.cap.p2p.transactional.controller.Main", {
    onSelectInspectionLot: function (event) {
      this._inspectionLotContext = event.getParameter("listItem").getBindingContext();
    },

    onSelectInvoice: function (event) {
      this._invoiceContext = event.getParameter("listItem").getBindingContext();
    },

    onSelectPaymentRun: function (event) {
      this._paymentRunContext = event.getParameter("listItem").getBindingContext();
    },

    onPostUsageDecision: function () {
      this._invokeWithContext("/postUsageDecision(...)", "lotId", this._inspectionLotContext, "Usage decision posted");
    },

    onRunThreeWayMatch: function () {
      this._invokeWithContext("/runThreeWayMatch(...)", "invoiceId", this._invoiceContext, "Three-way match completed");
    },

    onCreatePaymentAdvice: function () {
      this._invokeWithContext("/createPaymentAdvice(...)", "invoiceId", this._invoiceContext, "Payment advice created");
    },

    onExecutePaymentRun: function () {
      this._invokeWithContext("/executePaymentRun(...)", "paymentRunId", this._paymentRunContext, "Payment run executed");
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
