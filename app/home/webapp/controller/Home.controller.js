sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "p2p/common/Auth",
  "p2p/common/Header",
  "p2p/common/RoleAccess"
], function (Controller, JSONModel, MessageBox, Auth, Header, RoleAccess) {
  "use strict";

  return Controller.extend("p2p.home.controller.Home", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth("/home/index.html")) {
        return;
      }

      var session = Auth.getSession();

      var tiles = RoleAccess.getHomeTiles(session.role).map(function (tile) {
        return Object.assign({ count: "0", countScale: "" }, tile);
      });

      this.getView().setModel(new JSONModel({
        welcomeText: "Welcome, " + (session.fullName || session.userId),
        role: session.role,
        emailText: "Email: " + (session.email || "-"),
        companyText: "Company Code: " + (session.companyCode || "-"),
        costCenterText: "Cost Center: " + (session.costCenter || "-"),
        tiles: tiles
      }), "home");
      Auth.applyAuthHeader(this.getOwnerComponent().getModel());
      Header.apply(this);
      this._loadTileCounts();
    },

    onTilePress: function (event) {
      var context = event.getSource().getBindingContext("home");
      var path = context && context.getProperty("path");

      if (path) {
        Auth.navigateIfAllowed(path);
      }
    },

    onLogout: function () {
      Auth.logout();
    },

    _loadTileCounts: async function () {
      var model = this.getView().getModel("home");
      var tiles = model.getProperty("/tiles") || [];

      await Promise.all(tiles.map(async function (tile, index) {
        var tileValue = await this._readTileValue(tile.entity);
        model.setProperty("/tiles/" + index + "/count", tileValue.value);
        model.setProperty("/tiles/" + index + "/countScale", tileValue.scale);
      }, this));
    },

    _readTileValue: async function (entity) {
      if (entity === "Analytics") {
        return this._readAnalyticsSpend();
      }

      if (entity === "Users") {
        return this._readUserCount();
      }

      try {
        var countResponse = await fetch("/odata/v4/p2p/" + encodeURIComponent(entity) + "/$count");

        if (countResponse.ok) {
          return { value: String(Number(await countResponse.text()) || 0), scale: "" };
        }

        var listResponse = await fetch("/odata/v4/p2p/" + encodeURIComponent(entity) + "?$select=ID");

        if (!listResponse.ok) {
          return { value: "0", scale: "" };
        }

        return { value: String(((await listResponse.json()).value || []).length), scale: "" };
      } catch (error) {
        return { value: "0", scale: "" };
      }
    },

    _readUserCount: async function () {
      try {
        var response = await fetch("/odata/v4/p2p/Users?$select=ID&$top=5000");

        if (!response.ok) {
          return { value: "0", scale: "" };
        }

        return { value: String(((await response.json()).value || []).length), scale: "" };
      } catch (error) {
        return { value: "0", scale: "" };
      }
    },

    _readAnalyticsSpend: async function () {
      try {
        var response = await fetch("/odata/v4/p2p/VendorSpendAnalytics");

        if (!response.ok) {
          return { value: "0", scale: "INR" };
        }

        var rows = (await response.json()).value || [];
        var totalSpend = rows.reduce(function (sum, row) {
          return sum + Number(row.totalSpend || 0);
        }, 0);

        return { value: this._formatTileNumber(totalSpend), scale: "INR" };
      } catch (error) {
        return { value: "0", scale: "INR" };
      }
    },

    _formatTileNumber: function (value) {
      return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
  });
});
