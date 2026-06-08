sap.ui.define([
  "sap/m/MessageBox",
  "p2p/common/RoleAccess"
], function (MessageBox, RoleAccess) {
  "use strict";

  var HOME_PATH = "/home/index.html";
  var LOGOUT_PATH = "/logout";
  var STORAGE_KEYS = [
    "loggedInUser",
    "userRole",
    "userFullName",
    "userEmail",
    "companyCode",
    "costCenter"
  ];
  var sessionPromise = null;

  function currentPath() {
    return window.location.pathname.replace(/\/webapp\//, "/");
  }

  function clearSession() {
    STORAGE_KEYS.forEach(function (key) {
      localStorage.removeItem(key);
    });
    sessionStorage.removeItem("p2p.auth");
    sessionPromise = null;
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

  function primaryRole(user) {
    var roles = user && Array.isArray(user.roles)
      ? user.roles.map(function (role) {
        return role.roleName || role;
      }).filter(Boolean)
      : [];

    return roles[0] || "";
  }

  function saveSession(user) {
    var role = primaryRole(user);

    localStorage.setItem("loggedInUser", user.userId || "");
    localStorage.setItem("userRole", role);
    localStorage.setItem("userFullName", user.fullName || user.userId || "");
    localStorage.setItem("userEmail", user.email || "");
    localStorage.setItem("companyCode", user.companyCode || "");
    localStorage.setItem("costCenter", user.costCenter || "");
    return getSession();
  }

  async function fetchSession() {
    var response = await fetch("/odata/v4/p2p/getCurrentUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error("Unable to read BTP user roles.");
    }

    return saveSession(await response.json());
  }

  function showDeniedAndRedirect(message) {
    MessageBox.error(message || "You do not have permission to access this page.", {
      onClose: function () {
        window.location.href = HOME_PATH;
      }
    });
  }

  return {
    HOME_PATH: HOME_PATH,
    LOGOUT_PATH: LOGOUT_PATH,
    STORAGE_KEYS: STORAGE_KEYS,
    getSession: getSession,
    clearSession: clearSession,

    loadSession: function () {
      if (!sessionPromise) {
        sessionPromise = fetchSession().catch(function (error) {
          clearSession();
          throw error;
        });
      }
      return sessionPromise;
    },

    isLoggedIn: function () {
      return true;
    },

    requireAuth: function (path) {
      var session = getSession();
      var route = path || currentPath();

      if (session.role && !RoleAccess.isRouteAllowed(route, session.role)) {
        showDeniedAndRedirect("You do not have permission to access this page.");
        return false;
      }

      return true;
    },

    navigateIfAllowed: function (path) {
      var session = getSession();

      if (session.role && !RoleAccess.isRouteAllowed(path, session.role)) {
        showDeniedAndRedirect("You do not have permission to access this page.");
        return;
      }

      window.location.href = path;
    },

    applyAuthHeader: function (model) {
      return model;
    },

    ensureObjectAccess: function () {
      return this.requireAuth("/p2p-object-pages/index.html");
    },

    logout: function () {
      clearSession();
      window.location.href = LOGOUT_PATH;
    }
  };
});
