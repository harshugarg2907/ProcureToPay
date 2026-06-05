sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("sap.cap.p2p.ui.controller.GoodsReceipt", {
    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("launchpad", {}, true);
    }
  });
});
