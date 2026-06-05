sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("sap.cap.p2p.dashboard.controller.Overview", {
    openLogin: function () {
      window.location.href = "/login-page/index.html";
    },

    openProcurement: function () {
      window.location.href = "/procurement-pages/index.html";
    },

    openVendors: function () {
      window.location.href = "/vendors-master/index.html";
    }
  });
});
