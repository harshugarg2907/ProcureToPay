sap.ui.define([
  "sap/fe/core/AppComponent"
], function (AppComponent) {
  "use strict";

  return AppComponent.extend("sap.cap.p2p.procurement.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      AppComponent.prototype.init.apply(this, arguments);
      if (!localStorage.getItem("loggedInUser") || !localStorage.getItem("userRole")) {
        window.location.href = "/login-page/index.html";
      }
    }
  });
});
