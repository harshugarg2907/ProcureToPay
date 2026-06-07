(function () {
  "use strict";

  var form = document.getElementById("loginForm");
  var button = document.getElementById("loginButton");
  var message = document.getElementById("loginMessage");

  if (localStorage.getItem("loggedInUser") && localStorage.getItem("userRole")) {
    window.location.href = "/home/index.html";
    return;
  }

  function getPrimaryRole(user) {
    var roles = user && Array.isArray(user.roles)
      ? user.roles.map(function (role) {
        return role.roleName || role;
      }).filter(Boolean)
      : [];

    return roles[0] || "Viewer";
  }

  function saveUser(user, fallbackUserId) {
    localStorage.setItem("loggedInUser", user.userId || fallbackUserId);
    localStorage.setItem("userRole", getPrimaryRole(user));
    localStorage.setItem("userFullName", user.fullName || user.userId || fallbackUserId);
    localStorage.setItem("userEmail", user.email || "");
    localStorage.setItem("companyCode", user.companyCode || "");
    localStorage.setItem("costCenter", user.costCenter || "");
  }

  function clearUser() {
    ["loggedInUser", "userRole", "userFullName", "userEmail", "companyCode", "costCenter"].forEach(function (key) {
      localStorage.removeItem(key);
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    message.textContent = "";
    button.disabled = true;

    var userId = document.getElementById("userId").value || "viewer";

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

      sessionStorage.setItem("p2p.auth", JSON.stringify({ userId: userId }));
      saveUser(user, userId);
      window.location.href = "/home/index.html";
    } catch (error) {
      sessionStorage.removeItem("p2p.auth");
      clearUser();
      message.textContent = error.message || "Login failed.";
      button.disabled = false;
    }
  });
}());
