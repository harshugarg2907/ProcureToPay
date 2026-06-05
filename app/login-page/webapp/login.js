(function () {
  "use strict";

  var form = document.getElementById("loginForm");
  var button = document.getElementById("loginButton");
  var message = document.getElementById("loginMessage");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    message.textContent = "";
    button.disabled = true;

    var userId = document.getElementById("userId").value || "viewer";
    var password = document.getElementById("password").value || "";
    var authHeader = "Basic " + window.btoa(userId + ":" + password);

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
      message.textContent = error.message || "Login failed.";
      button.disabled = false;
    }
  });
}());
