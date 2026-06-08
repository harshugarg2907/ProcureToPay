(function () {
  "use strict";

  var HOME_PATH = "/home/index.html";
  var LOGOUT_PATH = "/logout";
  var STORAGE_KEYS = ["loggedInUser", "userRole", "userFullName", "userEmail", "companyCode", "costCenter"];
  var ROUTE_PERMISSIONS = {
    "/dashboard/index.html": ["P2P_ADMIN", "P2P_BUYER", "P2P_FINANCE_MANAGER"],
    "/procurement-pages/index.html": ["P2P_ADMIN", "P2P_BUYER", "P2P_REQUESTER"],
    "/user-management/index.html": ["P2P_ADMIN"],
    "/user-management/webapp/index.html": ["P2P_ADMIN"]
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

  function save(user) {
    var roles = Array.isArray(user.roles)
      ? user.roles.map(function (role) { return role.roleName || role; }).filter(Boolean)
      : [];

    localStorage.setItem("loggedInUser", user.userId || "");
    localStorage.setItem("userRole", roles[0] || "");
    localStorage.setItem("userFullName", user.fullName || user.userId || "");
    localStorage.setItem("userEmail", user.email || "");
    localStorage.setItem("companyCode", user.companyCode || "");
    localStorage.setItem("costCenter", user.costCenter || "");
  }

  async function loadSession() {
    var response = await fetch("/odata/v4/p2p/getCurrentUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (response.ok) {
      save(await response.json());
    }
  }

  function logout() {
    clear();
    window.location.href = LOGOUT_PATH;
  }

  function requireAuth(path) {
    var current = session();
    var roles = ROUTE_PERMISSIONS[path] || [];

    if (current.role && roles.length && roles.indexOf(current.role) === -1) {
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
      "<div class=\"p2p-user-meta\"><strong>" + (current.fullName || current.userId || "BTP User") + "</strong><span>" + (current.role || "BTP Role") + "</span><span>" + (current.email || current.companyCode || "") + "</span></div>",
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
    loadSession: loadSession,
    requireAuth: requireAuth,
    renderHeader: renderHeader,
    logout: logout,
    session: session
  };
}());
