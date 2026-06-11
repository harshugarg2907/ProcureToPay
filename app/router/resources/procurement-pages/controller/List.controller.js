sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("sap.cap.p2p.procurement.controller.List", {
    openDashboard: function () {
      window.location.href = "/home/index.html";
    }
  });
});
