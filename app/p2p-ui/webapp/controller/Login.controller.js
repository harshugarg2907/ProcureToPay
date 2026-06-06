sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/cap/p2p/ui/model/models"
], function (Controller, MessageBox, models) {
  "use strict";

  return Controller.extend("sap.cap.p2p.ui.controller.Login", {
    onLogin: async function () {
      const oComponent = this.getOwnerComponent();
      const oSession = oComponent.getModel("session");
      const sUserId = oSession.getProperty("/login/userId") || "viewer";

      try {
        const oUserData = await this._loadCurrentUser(sUserId);
        sessionStorage.setItem("p2p.auth", JSON.stringify({
          userId: sUserId
        }));
        oSession.setProperty("/currentUser", oUserData);
        this.getOwnerComponent().getRouter().navTo("launchpad", {}, true);
      } catch (error) {
        sessionStorage.removeItem("p2p.auth");
        MessageBox.error(error.message || "Unable to load current user.");
      }
    },

    _loadCurrentUser: async function (sUserId) {
      const oResponse = await fetch("/odata/v4/p2p/getCurrentUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: sUserId
        })
      });

      if (!oResponse.ok) {
        throw new Error("Invalid user ID or password.");
      }

      const oUser = await oResponse.json();
      const aRoles = Array.isArray(oUser.roles)
        ? oUser.roles.map((role) => role.roleName || role).filter(Boolean)
        : models.getUserDefinition(sUserId).roles;

      return {
        userId: oUser.userId,
        fullName: oUser.fullName,
        email: oUser.email,
        companyCode: oUser.companyCode,
        costCenter: oUser.costCenter,
        language: oUser.language,
        status: oUser.status,
        roles: aRoles
      };
    }
  });
});
