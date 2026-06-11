sap.ui.define([
  "sap/m/Button",
  "sap/cap/p2p/ui/model/models"
], function (Button, models) {
  "use strict";

  return Button.extend("sap.cap.p2p.ui.control.RoleButton", {
    metadata: {
      properties: {
        requiredRole: { type: "string", defaultValue: "" }
      }
    },

    renderer: null,

    onBeforeRendering: function () {
      const oSession = this.getModel("session");
      const sRole = this.getRequiredRole();
      this.setVisible(!sRole || models.hasRole(oSession?.getProperty("/currentUser/roles"), sRole));
    }
  });
});
