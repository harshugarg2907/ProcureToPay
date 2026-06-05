sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  return Controller.extend("sap.cap.p2p.ui.controller.Analytics", {
    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("launchpad", {}, true);
    },

    onNavigateToPO: function () {
      this.getOwnerComponent().getRouter().navTo("purchaseOrders");
    },

    onNavigateToInvoice: function () {
      this.getOwnerComponent().getRouter().navTo("invoice");
    },

    onNavigateToPayment: function () {
      this.getOwnerComponent().getRouter().navTo("paymentRun");
    }
  });
});
