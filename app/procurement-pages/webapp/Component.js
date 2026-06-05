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
