sap.ui.define([
  "sap/m/MessageBox",
  "p2p/common/RoleAccess"
], function (MessageBox, RoleAccess) {
  "use strict";

  var LOGIN_PATH = "/login-page/index.html";
  var HOME_PATH = "/home/index.html";
  var STORAGE_KEYS = [
    "loggedInUser",
    "userRole",
    "userFullName",
    "userEmail",
    "companyCode",
    "costCenter"
  ];

  function currentPath() {
    return window.location.pathname.replace(/\/webapp\//, "/");
  }

  function clearSession() {
    STORAGE_KEYS.forEach(function (key) {
      localStorage.removeItem(key);
    });
    sessionStorage.removeItem("p2p.auth");
  }

  function getSession() {
    return {
      userId: localStorage.getItem("loggedInUser") || "",
      role: localStorage.getItem("userRole") || "",
      fullName: localStorage.getItem("userFullName") || localStorage.getItem("loggedInUser") || "",
      email: localStorage.getItem("userEmail") || "",
      companyCode: localStorage.getItem("companyCode") || "",
      costCenter: localStorage.getItem("costCenter") || ""
    };
  }

  function redirectToLogin() {
    window.location.href = LOGIN_PATH;
  }

  function showDeniedAndRedirect(message) {
    MessageBox.error(message || "You do not have permission to access this page.", {
      onClose: function () {
        window.location.href = HOME_PATH;
      }
    });
    setTimeout(function () {
      window.location.href = HOME_PATH;
    }, 1800);
  }

  return {
    LOGIN_PATH: LOGIN_PATH,
    HOME_PATH: HOME_PATH,
    STORAGE_KEYS: STORAGE_KEYS,
    getSession: getSession,
    clearSession: clearSession,

    isLoggedIn: function () {
      var session = getSession();
      return !!(session.userId && session.role);
    },

    requireAuth: function (path) {
      var session = getSession();

      if (!session.userId || !session.role) {
        redirectToLogin();
        return false;
      }

      if (!RoleAccess.isRouteAllowed(path || currentPath(), session.role)) {
        showDeniedAndRedirect("You do not have permission to access this page.");
        return false;
      }

      return true;
    },

    navigateIfAllowed: function (path) {
      var session = getSession();

      if (!session.role) {
        redirectToLogin();
        return;
      }

      if (!RoleAccess.isRouteAllowed(path, session.role)) {
        showDeniedAndRedirect("You do not have permission to access this page.");
        return;
      }

      window.location.href = path;
    },

    applyAuthHeader: function (model) {
      return model;
    },

    ensureObjectAccess: function () {
      var session = getSession();
      var allowedRoles = RoleAccess.ROUTE_PERMISSIONS["/p2p-object-pages/index.html"] || [];

      if (allowedRoles.indexOf(session.role) === -1) {
        MessageBox.error("You do not have permission to view details.");
        return false;
      }

      return true;
    },

    logout: function () {
      clearSession();
      window.location.href = LOGIN_PATH;
    }
  };
});
