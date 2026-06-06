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
      this.setModel(models.createDeviceModel(), "device");
      this.setModel(new JSONModel(models.createSession()), "session");

      var router = this.getRouter();
      router.attachBeforeRouteMatched(this._guardRoute, this);
      router.initialize();
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
