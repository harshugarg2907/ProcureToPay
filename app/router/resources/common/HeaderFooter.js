sap.ui.define([
  "sap/m/Bar",
  "sap/m/Button",
  "sap/m/Text",
  "sap/m/ToolbarSpacer",
  "p2p/common/Auth"
], function (Bar, Button, Text, ToolbarSpacer, Auth) {
  "use strict";

  function ensureStyles() {
    if (!document.getElementById("p2p-common-style")) {
      var link = document.createElement("link");
      link.id = "p2p-common-style";
      link.rel = "stylesheet";
      link.href = "/common/css/style.css";
      document.head.appendChild(link);
    }
  }

  function findPage(controller) {
    var view = controller.getView();
    var pages = view.findAggregatedObjects(true, function (control) {
      return control.isA && control.isA("sap.m.Page");
    });

    return pages[0];
  }

  function titleFor(page, fallback) {
    return page && page.getTitle && page.getTitle() ? page.getTitle() : fallback || "";
  }

  return {
    apply: function (controller, pageTitle) {
      var page = findPage(controller);
      var session = Auth.getSession();

      if (!page) {
        return;
      }

      ensureStyles();
      page.addStyleClass("p2pShellPage");
      page.setCustomHeader(new Bar({
        design: "Header",
        contentLeft: [
          new Text({ text: "Procure To Pay" }).addStyleClass("p2pHeaderBrand"),
          new Text({ text: titleFor(page, pageTitle) }).addStyleClass("p2pHeaderPageTitle")
        ],
        contentMiddle: [
          new Text({
            text: (session.fullName || session.userId || "User") + " | " + session.role + " | " + (session.companyCode || "-")
          }).addStyleClass("p2pHeaderMeta")
        ],
        contentRight: [
          new ToolbarSpacer(),
          new Button({ icon: "sap-icon://home", text: "Home", type: "Transparent", press: function () { window.location.href = Auth.HOME_PATH; } }),
          new Button({ icon: "sap-icon://log", text: "Logout", type: "Transparent", press: Auth.logout })
        ]
      }).addStyleClass("p2pFixedHeader"));

      page.setFooter(new Bar({
        contentLeft: [
          new Text({ text: "© 2026 Procure To Pay System" })
        ],
        contentMiddle: [
          new Text({ text: "SAP CAP | SAPUI5 | BTP" })
        ],
        contentRight: [
          new Text({ text: session.role ? "Role: " + session.role : "" })
        ]
      }).addStyleClass("p2pFixedFooter"));
    }
  };
});
