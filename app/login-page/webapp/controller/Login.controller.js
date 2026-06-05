sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
  "use strict";

  return Controller.extend("sap.cap.p2p.login.controller.Login", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        userId: "admin",
        password: "admin"
      }), "view");
    },

    onLogin: async function () {
      var data = this.getView().getModel("view").getData();
      var userId = data.userId || "viewer";
      var authHeader = "Basic " + window.btoa(userId + ":" + (data.password || ""));

      try {
        var response = await fetch("/odata/v4/p2p/getCurrentUser", {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: userId
          })
        });

        if (!response.ok) {
          throw new Error("Invalid user ID or password.");
        }

        sessionStorage.setItem("p2p.auth", JSON.stringify({
          userId: userId,
          authorization: authHeader
        }));
        window.location.href = "/dashboard/index.html";
      } catch (error) {
        sessionStorage.removeItem("p2p.auth");
        MessageBox.error(error.message || "Login failed");
      }
    }
  });
});
