sap.ui.define([], function () {
  "use strict";

  function getBasePath(appName) {
    // Environment detection: Check if the current URL contains "/webapp/" (Cloud Foundry)
    var isWebapp = window.location.pathname.indexOf("/webapp/") !== -1;
    return "/" + appName + (isWebapp ? "/webapp" : "") + "/index.html";
  }

  var Navigation = {
    paths: {
      HOME: "home",
      LOGIN: "login-page",
      LIST_OBJECT: "p2p-list-object",
      OBJECT_PAGE: "p2p-object-pages",
      ANALYTICS: "p2p-analytical",
      PROCUREMENT: "procurement-pages",
      TRANSACTIONAL: "p2p-transactional",
      USER_MANAGEMENT: "user-management"
    },

    getAppUrl: function (appKey, paramsOrHash) {
      var appName = this.paths[appKey] || appKey;
      return getBasePath(appName) + (paramsOrHash || "");
    },

    navigate: function (appKey, paramsOrHash) {
      window.location.href = this.getAppUrl(appKey, paramsOrHash);
    }
  };

  return Navigation;
});