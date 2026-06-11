sap.ui.define([
  "sap/m/Panel",
  "sap/m/VBox",
  "sap/m/ObjectIdentifier",
  "sap/m/ObjectAttribute",
  "sap/m/ObjectStatus",
  "sap/m/Text"
], function (Panel, VBox, ObjectIdentifier, ObjectAttribute, ObjectStatus, Text) {
  "use strict";

  return Panel.extend("sap.cap.p2p.ui.composite.ProcessCard", {
    metadata: {
      properties: {
        title: { type: "string", defaultValue: "" },
        subtitle: { type: "string", defaultValue: "" },
        transactionCode: { type: "string", defaultValue: "" },
        module: { type: "string", defaultValue: "" },
        status: { type: "string", defaultValue: "" },
        icon: { type: "string", defaultValue: "sap-icon://business-objects-experience" },
        count: { type: "int", defaultValue: 0 }
      }
    },

    renderer: {
      apiVersion: 2
    },

    init: function () {
      if (Panel.prototype.init) {
        Panel.prototype.init.apply(this, arguments);
      }

      this.setWidth("300px");
      this.setHeight("180px");
      this.addStyleClass("sapUiSmallMargin");

      this._oIdentifier = new ObjectIdentifier();
      this._oModule = new ObjectAttribute();
      this._oStatus = new ObjectStatus();
      this._oCount = new Text();

      this.addContent(new VBox({
        fitContainer: true,
        items: [
          this._oIdentifier,
          this._oModule,
          this._oStatus,
          this._oCount
        ]
      }).addStyleClass("sapUiSmallMargin"));
    },

    onBeforeRendering: function () {
      this.setHeaderText(this.getTitle());
      this._oIdentifier.setTitle(this.getSubtitle());
      this._oIdentifier.setText(this.getTransactionCode());
      this._oModule.setText(this.getModule());
      this._oStatus.setText(this.getStatus());
      this._oCount.setText(this.getCount() ? `Items: ${this.getCount()}` : "");
    }
  });
});
