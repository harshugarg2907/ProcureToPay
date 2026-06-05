sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "sap/cap/p2p/ui/model/models",
  "sap/cap/p2p/ui/localService/mockserver"
], function (UIComponent, JSONModel, models, mockserver) {
  "use strict";

  return UIComponent.extend("sap.cap.p2p.ui.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      if (new URLSearchParams(window.location.search).get("mock") === "true") {
        mockserver.init();
      }

      UIComponent.prototype.init.apply(this, arguments);
      this._applyStoredAuth();
      this.setModel(models.createDeviceModel(), "device");
      this.setModel(new JSONModel(models.createSession()), "session");

      var router = this.getRouter();
      router.attachBeforeRouteMatched(this._guardRoute, this);
      router.initialize();
    },

    _applyStoredAuth: function () {
      var auth = JSON.parse(sessionStorage.getItem("p2p.auth") || "{}");
      var model = this.getModel();

      if (auth.authorization && model && typeof model.changeHttpHeaders === "function") {
        model.changeHttpHeaders({
          Authorization: auth.authorization
        });
      }
    },

    _guardRoute: function (event) {
      var routeName = event.getParameter("name");
      var session = this.getModel("session").getData();
      if (!models.isRouteAllowed(routeName, session.currentUser.roles)) {
        this.getRouter().navTo("accessDenied", {}, true);
      }
    }
  });
});
