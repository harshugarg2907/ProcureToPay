sap.ui.define([], function () {
  "use strict";

  return {
    hasRole: function (roles, requiredRole) {
      if (!roles || !requiredRole) {
        return false;
      }
      return roles.indexOf(requiredRole) !== -1;
    }
  };
});
