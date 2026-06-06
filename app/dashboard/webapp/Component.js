sap.ui.define([
  "sap/ui/core/UIComponent"
], function (UIComponent) {
  "use strict";

  return UIComponent.extend("sap.cap.p2p.dashboard.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      if (!localStorage.getItem("loggedInUser") || !localStorage.getItem("userRole")) {
        window.location.href = "/login-page/index.html";
      }
    }
  });
});
