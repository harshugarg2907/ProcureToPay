sap.ui.define([
  "sap/m/Label"
], function (Label) {
  "use strict";

  return Label.extend("sap.cap.p2p.ui.control.StatusBadge", {
    metadata: {
      properties: {
        status: { type: "string", defaultValue: "None" },
        text: { type: "string", defaultValue: "" }
      }
    },

    renderer: {
      apiVersion: 2
    }
  });
});
