sap.ui.define([
  "sap/m/Panel",
  "sap/m/Text"
], function (Panel, Text) {
  "use strict";

  return Panel.extend("sap.cap.p2p.ui.control.ProcessStep", {
    metadata: {
      properties: {
        title: { type: "string", defaultValue: "" },
        subtitle: { type: "string", defaultValue: "" },
        status: { type: "string", defaultValue: "" }
      }
    },

    renderer: {
      apiVersion: 2
    },

    init: function () {
      if (Panel.prototype.init) {
        Panel.prototype.init.apply(this, arguments);
      }
      this.setHeaderText(this.getTitle());
      this.addContent(new Text({ text: this.getSubtitle() }));
      this.addContent(new Text({ text: this.getStatus() }));
    }
  });
});
