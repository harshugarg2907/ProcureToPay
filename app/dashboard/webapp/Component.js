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
      this._applyStoredAuth();
    },

    _applyStoredAuth: function () {
      var auth = JSON.parse(sessionStorage.getItem("p2p.auth") || "{}");
      var model = this.getModel();

      if (!auth.authorization) {
        window.location.href = "/login-page/index.html";
        return;
      }

      if (model && typeof model.changeHttpHeaders === "function") {
        model.changeHttpHeaders({
          Authorization: auth.authorization
        });
      }
    }
  });
});
