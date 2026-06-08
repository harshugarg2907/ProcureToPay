sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  return Controller.extend("sap.cap.p2p.ui.controller.RFQ", {
    onCreateRFQ: function () {
      MessageToast.show("Create RFQ action triggered.");
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("launchpad", {}, true);
    }
  });
});
