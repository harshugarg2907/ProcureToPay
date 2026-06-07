sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
  "use strict";

  return Controller.extend("sap.cap.p2p.login.controller.Login", {
    onInit: function () {
      if (localStorage.getItem("loggedInUser") && localStorage.getItem("userRole")) {
        window.location.href = "/home/index.html";
        return;
      }

      this.getView().setModel(new JSONModel({
        userId: "admin",
        password: "admin"
      }), "view");
    },

    onLogin: async function () {
      var data = this.getView().getModel("view").getData();
      var userId = data.userId || "viewer";

      try {
        var response = await fetch("/odata/v4/p2p/getCurrentUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: userId
          })
        });

        if (!response.ok) {
          throw new Error("Invalid user ID or password.");
        }

        var user = await response.json();
        var roles = Array.isArray(user.roles)
          ? user.roles.map(function (role) {
            return role.roleName || role;
          }).filter(Boolean)
          : [];
        var userRole = roles[0] || "Viewer";

        sessionStorage.setItem("p2p.auth", JSON.stringify({
          userId: userId
        }));
        localStorage.setItem("loggedInUser", user.userId || userId);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userFullName", user.fullName || user.userId || userId);
        localStorage.setItem("userEmail", user.email || "");
        localStorage.setItem("companyCode", user.companyCode || "");
        localStorage.setItem("costCenter", user.costCenter || "");
        window.location.href = "/home/index.html";
      } catch (error) {
        sessionStorage.removeItem("p2p.auth");
        ["loggedInUser", "userRole", "userFullName", "userEmail", "companyCode", "costCenter"].forEach(function (key) {
          localStorage.removeItem(key);
        });
        MessageBox.error(error.message || "Login failed");
      }
    }
  });
});
