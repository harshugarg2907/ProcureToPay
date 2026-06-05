sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("sap.cap.p2p.listobject.controller.Main", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        title: "Select a document",
        number: "",
        numberUnit: "",
        intro: "",
        status: "",
        purchasingOrg: "",
        companyCode: ""
      }), "detail");
    },

    onRequisitionSelected: function (event) {
      this._bindDetail(event);
    },

    onRFQSelected: function (event) {
      this._bindDetail(event);
    },

    onPOSelected: function (event) {
      this._bindDetail(event);
    },

    _bindDetail: async function (event) {
      var item = event.getParameter("listItem");
      if (item) {
        var object = await item.getBindingContext().requestObject();
        this.getView().getModel("detail").setData({
          title: object.prNo || object.rfqNo || object.poNo || "Selected document",
          number: object.totalNetValue || "",
          numberUnit: object.currency || "",
          intro: object.requisitioner || object.purchasingOrg || object.companyCode || "",
          status: object.status || "",
          purchasingOrg: object.purchasingOrg || "",
          companyCode: object.companyCode || ""
        });
      }
    }
  });
});
