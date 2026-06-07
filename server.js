const cds = require("@sap/cds");
const express = require("express");
const path = require("path");

const uiApps = [
  "common",
  "dashboard",
  "home",
  "login-page",
  "p2p-analytical",
  "p2p-list-object",
  "p2p-object-pages",
  "p2p-transactional",
  "p2p-ui",
  "procurement-pages",
  "user-management"
];

cds.on("bootstrap", (app) => {
  app.get("/", (_req, res) => {
    res.redirect("/login-page/index.html");
  });

  uiApps.forEach((appName) => {
    app.use(
      `/${appName}`,
      express.static(path.join(__dirname, "app", appName, "webapp"))
    );
  });
});

module.exports = cds.server;
