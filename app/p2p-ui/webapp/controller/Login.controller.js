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
      const sPassword = oSession.getProperty("/login/password") || "";
      const oODataModel = oComponent.getModel();

      if (oODataModel && typeof oODataModel.changeHttpHeaders === "function" && sPassword) {
        const sAuth = "Basic " + window.btoa(`${sUserId}:${sPassword}`);
        oODataModel.changeHttpHeaders({ Authorization: sAuth });
      }

      try {
        const oUserData = await this._loadCurrentUser(oODataModel, sUserId);
        oSession.setProperty("/currentUser", oUserData);
        this.getOwnerComponent().getRouter().navTo("launchpad", {}, true);
      } catch (error) {
        MessageBox.error(error.message || "Unable to load current user.");
      }
    },

    _loadCurrentUser: async function (oODataModel, sUserId) {
      if (!oODataModel || typeof oODataModel.bindContext !== "function") {
        return models.getUserDefinition(sUserId);
      }

      const oBinding = oODataModel.bindContext("/getCurrentUser(...)");
      oBinding.setParameter("userId", sUserId);
      await oBinding.invoke("$direct");

      const oContext = oBinding.getBoundContext();
      const oUser = await oContext.requestObject();
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
