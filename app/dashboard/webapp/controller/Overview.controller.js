sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("sap.cap.p2p.dashboard.controller.Overview", {
    openLogin: function () {
      window.location.href = "/home/index.html";
    },

    openProcurement: function () {
      window.location.href = "/home/index.html";
    },

    openVendors: function () {
      window.location.href = "/p2p-list-object/index.html?entity=Vendors";
    }
  });
});
