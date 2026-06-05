sap.ui.define([
  "sap/ui/core/util/MockServer",
  "sap/base/Log"
], function (MockServer, Log) {
  "use strict";

  return {
    init: function () {
      const oMockServer = new MockServer({
        rootUri: "/odata/v4/p2p/"
      });
      const sMetadataUrl = sap.ui.require.toUrl("sap/cap/p2p/ui/localService/metadata.xml");
      oMockServer.simulate(sMetadataUrl, {
        sMockdataBaseUrl: sap.ui.require.toUrl("sap/cap/p2p/ui/localService/mockdata"),
        bGenerateMissingMockData: true
      });
      oMockServer.start();
      Log.info("MockServer started at /odata/v4/p2p/");
    }
  };
});
