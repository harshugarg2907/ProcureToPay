sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("sap.cap.p2p.objectpages.controller.Main", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        title: "Select an object",
        intro: "",
        number: "",
        numberUnit: "",
        status: "",
        email: "",
        paymentTerms: "",
        materialGroup: "",
        plant: "",
        baseUom: ""
      }), "detail");
    },

    onVendorSelected: function (event) {
      this._bindObject(event);
    },

    onMaterialSelected: function (event) {
      this._bindObject(event);
    },

    _bindObject: async function (event) {
      var item = event.getParameter("listItem");
      if (item) {
        var object = await item.getBindingContext().requestObject();
        this.getView().getModel("detail").setData({
          title: object.name || object.materialNo || "Selected object",
          intro: object.description || object.city || "",
          number: object.movingAvgPrice || "",
          numberUnit: object.movingAvgPrice ? "INR" : "",
          status: object.status || "",
          email: object.email || "",
          paymentTerms: object.paymentTerms || "",
          materialGroup: object.materialGroup || "",
          plant: object.plant || "",
          baseUom: object.baseUom || ""
        });
      }
    }
  });
});
