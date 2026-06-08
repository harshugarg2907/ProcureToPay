sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("sap.cap.p2p.ui.controller.Launchpad", {
    onProfile: function () {
      this.getOwnerComponent().getRouter().navTo("profile");
    },

    onNavigateToPR: function () {
      this.getOwnerComponent().getRouter().navTo("purchaseRequisition");
    },

    onNavigateToRFQ: function () {
      this.getOwnerComponent().getRouter().navTo("rfq");
    },

    onNavigateToVendors: function () {
      this.getOwnerComponent().getRouter().navTo("vendors");
    },

    onNavigateToMaterials: function () {
      this.getOwnerComponent().getRouter().navTo("materials");
    },

    onNavigateToPO: function () {
      this.getOwnerComponent().getRouter().navTo("purchaseOrders");
    },

    onNavigateToQC: function () {
      this.getOwnerComponent().getRouter().navTo("qualityInspection");
    },

    onNavigateToGR: function () {
      this.getOwnerComponent().getRouter().navTo("goodsReceipt");
    },

    onNavigateToInvoice: function () {
      this.getOwnerComponent().getRouter().navTo("invoice");
    },

    onNavigateToPayment: function () {
      this.getOwnerComponent().getRouter().navTo("paymentRun");
    },

    onNavigateToAnalytics: function () {
      this.getOwnerComponent().getRouter().navTo("analytics");
    }
  });
});
