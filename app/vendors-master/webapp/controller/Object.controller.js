sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("sap.cap.p2p.vendors.controller.Object", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        selectedVendorPath: ""
      }), "view");
    },

    onVendorSelected: function (event) {
      var item = event.getParameter("listItem");
      if (item) {
        var path = item.getBindingContext().getPath();
        this.getView().getModel("view").setProperty("/selectedVendorPath", path);
        this.byId("detailPage").bindElement(path);
      }
    },

    openDashboard: function () {
      window.location.href = "/dashboard/index.html";
    }
  });
});
