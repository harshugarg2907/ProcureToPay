sap.ui.define(["sap/ui/core/library"], function (coreLibrary) {
  "use strict";

  const ButtonType = coreLibrary.ButtonType;

  return {
    name: "sap.cap.p2p.ui.lib",
    dependencies: ["sap.m"],
    types: {
      ButtonType
    }
  };
});
