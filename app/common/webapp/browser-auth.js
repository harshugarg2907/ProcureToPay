(function () {
  "use strict";

  var LOGIN_PATH = "/login-page/index.html";
  var HOME_PATH = "/home/index.html";
  var STORAGE_KEYS = ["loggedInUser", "userRole", "userFullName", "userEmail", "companyCode", "costCenter"];
  var ROUTE_PERMISSIONS = {
    "/dashboard/index.html": ["Admin", "ProcurementOfficer", "FinanceOfficer", "Viewer"],
    "/procurement-pages/index.html": ["Admin", "ProcurementOfficer"],
    "/user-management/index.html": ["Admin"],
    "/user-management/webapp/index.html": ["Admin"]
  };

  function session() {
    return {
      userId: localStorage.getItem("loggedInUser") || "",
      role: localStorage.getItem("userRole") || "",
      fullName: localStorage.getItem("userFullName") || localStorage.getItem("loggedInUser") || "",
      email: localStorage.getItem("userEmail") || "",
      companyCode: localStorage.getItem("companyCode") || "",
      costCenter: localStorage.getItem("costCenter") || ""
    };
  }

  function ensureStyles() {
    if (document.getElementById("p2p-common-style")) {
      return;
    }

    var link = document.createElement("link");
    link.id = "p2p-common-style";
    link.rel = "stylesheet";
    link.href = "/common/css/style.css";
    document.head.appendChild(link);
  }

  function clear() {
    STORAGE_KEYS.forEach(function (key) { localStorage.removeItem(key); });
    sessionStorage.removeItem("p2p.auth");
  }

  function logout() {
    clear();
    window.location.href = LOGIN_PATH;
  }

  function requireAuth(path) {
    var current = session();
    var roles = ROUTE_PERMISSIONS[path] || [];

    if (!current.userId || !current.role) {
      window.location.href = LOGIN_PATH;
      return false;
    }

    if (roles.indexOf(current.role) === -1) {
      alert("You do not have permission to access this page.");
      window.location.href = HOME_PATH;
      return false;
    }

    return true;
  }

  function renderHeader(title) {
    var current = session();
    var header = document.querySelector(".topbar");

    ensureStyles();

    if (!header) {
      return;
    }

    header.classList.add("p2p-fixed-header");
    header.innerHTML = [
      "<div><p class=\"eyebrow\">Procure To Pay</p><h1>" + title + "</h1></div>",
      "<div class=\"p2p-user-meta\"><strong>" + (current.fullName || current.userId) + "</strong><span>" + current.role + "</span><span>" + (current.email || current.companyCode) + "</span></div>",
      "<div class=\"p2p-header-actions\"><a class=\"button\" href=\"" + HOME_PATH + "\">Home</a><button id=\"logoutButton\" class=\"button\" type=\"button\">Logout</button></div>"
    ].join("");
    document.getElementById("logoutButton").addEventListener("click", logout);

    if (!document.querySelector(".p2p-page-footer")) {
      var footer = document.createElement("footer");
      footer.className = "p2p-page-footer";
      footer.innerHTML = "<span>© 2026 Procure To Pay System</span><span>SAP CAP | SAPUI5 | BTP</span><span>Role: " + (current.role || "-") + "</span>";
      document.body.appendChild(footer);
    }
  }

  window.P2PAuth = {
    requireAuth: requireAuth,
    renderHeader: renderHeader,
    logout: logout,
    session: session
  };
}());
