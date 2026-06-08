sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/Button",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/Dialog",
  "sap/m/Input",
  "sap/m/Label",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/m/Text",
  "sap/m/VBox",
  "sap/m/Select",
  "sap/ui/core/Item",
  "sap/m/DatePicker",
  "p2p/common/Auth",
  "p2p/common/Header",
  "p2p/common/RoleAccess"
], function (Controller, JSONModel, Button, Column, ColumnListItem, Dialog, Input, Label, MessageBox, MessageToast, Text, VBox, Select, Item, DatePicker, Auth, Header, RoleAccess) {
  "use strict";

  var ENTITY_CONFIG = {
    Vendors: { title: "Vendor Master", search: "Search vendors", fields: ["vendorNo", "name", "email", "telephone", "city", "purchOrg", "status"], columns: [["Vendor", "vendorNo"], ["Name", "name"], ["Email", "email"], ["Phone", "telephone"], ["Address", "city"], ["Company Code", "purchOrg"], ["Status", "status"]] },
    Materials: { title: "Material Master", search: "Search materials", fields: ["materialNo", "description", "materialGroup", "baseUom", "movingAvgPrice", "plant", "status"], columns: [["Material", "materialNo"], ["Description", "description"], ["Category", "materialGroup"], ["Unit", "baseUom"], ["Price", "movingAvgPrice"], ["Plant", "plant"], ["Status", "status"]] },
    PurchaseRequisitions: { title: "Purchase Requisitions", search: "Search PR number, status, requisitioner", fields: ["prNo", "requisitioner", "purchasingOrg", "documentType", "requestDate", "status", "totalItems"], columns: [["PR", "prNo"], ["Requisitioner", "requisitioner"], ["Purchasing Org", "purchasingOrg"], ["Status", "status"], ["Items", "totalItems"]] },
    RFQs: { title: "RFQs", search: "Search RFQ number or status", fields: ["rfqNo", "rfqType", "purchasingOrg", "purchasingGroup", "submissionDeadline", "status"], columns: [["RFQ", "rfqNo"], ["Type", "rfqType"], ["Purchasing Org", "purchasingOrg"], ["Deadline", "submissionDeadline"], ["Status", "status"]] },
    PurchaseOrders: { title: "Purchase Orders", search: "Search PO number, status, vendor", fields: ["poNo", "purchasingOrg", "purchasingGroup", "companyCode", "currency", "documentDate", "deliveryDate", "status", "totalNetValue"], columns: [["PO", "poNo"], ["Company Code", "companyCode"], ["Currency", "currency"], ["Delivery Date", "deliveryDate"], ["Status", "status"], ["Net Value", "totalNetValue"]] },
    InspectionLots: { title: "Inspection Lots", search: "Search lot number or status", fields: ["inspectionLotNo", "inspectionType", "lotQuantity", "acceptedQuantity", "rejectedQuantity", "usageDecisionCode", "rejectionReason", "status"], columns: [["Lot", "inspectionLotNo"], ["Type", "inspectionType"], ["Lot Qty", "lotQuantity"], ["Accepted", "acceptedQuantity"], ["Rejected", "rejectedQuantity"], ["Status", "status"]] },
    GoodsReceipts: { title: "Goods Receipts", search: "Search GR number, status, plant", fields: ["grNo", "postingDate", "documentDate", "plant", "storageLocation", "batch", "totalGRValue", "status"], columns: [["GR", "grNo"], ["Posting Date", "postingDate"], ["Plant", "plant"], ["Storage", "storageLocation"], ["Value", "totalGRValue"], ["Status", "status"]] },
    Invoices: { title: "Supplier Invoices", search: "Search invoice number or status", fields: ["invoiceNo", "invoiceDate", "postingDate", "currency", "paymentTerms", "netAmount", "taxAmount", "totalPayable", "matchStatus", "status"], columns: [["Invoice", "invoiceNo"], ["Invoice Date", "invoiceDate"], ["Currency", "currency"], ["Payable", "totalPayable"], ["Match", "matchStatus"], ["Status", "status"]] },
    PaymentRuns: { title: "Payment Runs", search: "Search payment run ID, status, company code", fields: ["paymentRunId", "runDate", "companyCode", "paymentMethod", "nextPaymentDate", "status", "totalPaymentAmount"], columns: [["Run", "paymentRunId"], ["Run Date", "runDate"], ["Company Code", "companyCode"], ["Method", "paymentMethod"], ["Amount", "totalPaymentAmount"], ["Status", "status"]] }
  };
  var GENERATED_FIELDS = {
    Vendors: ["vendorNo"],
    Materials: ["materialNo"],
    PurchaseRequisitions: ["prNo"],
    RFQs: ["rfqNo"],
    PurchaseOrders: ["poNo"],
    InspectionLots: ["inspectionLotNo"],
    GoodsReceipts: ["grNo"],
    Invoices: ["invoiceNo"],
    PaymentRuns: ["paymentRunId"]
  };

  return Controller.extend("sap.cap.p2p.listobject.controller.Main", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth("/p2p-list-object/index.html")) {
        return;
      }

      this._entity = new URLSearchParams(window.location.search).get("entity") || "PurchaseRequisitions";
      this._config = ENTITY_CONFIG[this._entity] || ENTITY_CONFIG.PurchaseRequisitions;
      this._rows = [];
      this.getView().setModel(new JSONModel({
        title: this._config.title,
        searchPlaceholder: this._config.search,
        rows: [],
        canCreate: RoleAccess.canWriteEntity(this._entity, Auth.getSession().role)
      }), "list");
      Header.apply(this, this._config.title);
      this._buildTable();
      this._loadRows();
    },

    onSearch: function (event) {
      var query = (event.getParameter("newValue") || "").toLowerCase();
      var rows = this._rows.filter(function (row) {
        return this._config.columns.some(function (column) {
          return String(row[column[1]] || "").toLowerCase().indexOf(query) !== -1;
        });
      }, this);
      this.getView().getModel("list").setProperty("/rows", rows);
    },

    onItemSelected: function (event) {
      var context = event.getParameter("listItem") && event.getParameter("listItem").getBindingContext("list");
      var id = context && context.getProperty("ID");

      if (!id) {
        MessageBox.error("No selected record found.");
        return;
      }

      window.location.href = "/p2p-object-pages/index.html#/object/" + encodeURIComponent(this._entity) + "/" + encodeURIComponent(id);
    },

    onCreate: async function () {
      if (this._entity === "PurchaseRequisitions") {
        try {
          var response = await fetch("/odata/v4/p2p/Materials");
          var data = await response.json();
          this._materials = data.value || [];
        } catch (e) {
          this._materials = [];
        }
      }
      this._openDialog("Create", {});
    },

    _buildTable: function () {
      var table = this.byId("entityTable");
      table.destroyColumns();
      this._config.columns.forEach(function (column) {
        table.addColumn(new Column({ header: new Text({ text: column[0] }) }));
      });
      table.bindItems({
        path: "list>/rows",
        template: new ColumnListItem({
          type: "Navigation",
          cells: this._config.columns.map(function (column) {
            return new Text({ text: "{list>" + column[1] + "}" });
          })
        })
      });
    },

    _loadRows: async function () {
      try {
        var params = new URLSearchParams(window.location.search);
        var response = await fetch("/odata/v4/p2p/" + this._entity);

        if (!response.ok) {
          throw new Error("Unable to load " + this._config.title + ".");
        }

        var data = await response.json();
        var rows = data.value || [];
        var status = params.get("status");
        var vendor = params.get("vendor");

        if (status) {
          rows = rows.filter(function (row) { return row.status === status; });
        }
        if (vendor) {
          rows = rows.filter(function (row) { return JSON.stringify(row).toLowerCase().indexOf(vendor.toLowerCase()) !== -1; });
        }

        this._rows = rows;
        this.getView().getModel("list").setProperty("/rows", rows);
      } catch (error) {
        MessageBox.error(error.message || "Unable to load data.");
      }
    },

    _openDialog: function (mode, data) {
      var inputs = {};
      var box = new VBox({ class: "sapUiSmallMargin p2pDialogForm", width: "24rem" });

      this._editableFields().forEach(function (field) {
        var labelText = field;
        if (this._entity === "PurchaseRequisitions") {
          if (field === "requisitioner") labelText = "Name";
          if (field === "documentType") labelText = "Materials";
          if (field === "requestDate") labelText = "Request Date";
        }

        if (["requestDate", "submissionDeadline", "documentDate", "deliveryDate", "postingDate", "invoiceDate", "runDate", "nextPaymentDate"].indexOf(field) !== -1) {
          inputs[field] = new DatePicker({
            displayFormat: "yyyy-MM-dd",
            valueFormat: "yyyy-MM-dd",
            value: data[field] || ""
          });
        } else if (this._entity === "PurchaseRequisitions" && field === "documentType") {
          var matSelect = new Select({ width: "100%", selectedKey: data[field] || "" });
          matSelect.addItem(new Item({ key: "", text: "Select a Material..." }));
          (this._materials || []).forEach(function(m) {
            matSelect.addItem(new Item({ key: m.materialNo, text: m.description + " (" + m.materialNo + ")" }));
          });
          matSelect.addItem(new Item({ key: "OTHER", text: "Other (New Material)" }));
          inputs[field] = matSelect;
          inputs["_newMaterialName"] = new Input({ visible: false, placeholder: "Enter new material name" });
          matSelect.attachChange(function(oEvent) {
            var key = oEvent.getParameter("selectedItem").getKey();
            inputs["_newMaterialName"].setVisible(key === "OTHER");
          });
        } else {
          inputs[field] = new Input({ value: data[field] || "" });
        }
        box.addItem(new Label({ text: labelText }));
        box.addItem(inputs[field]);
        if (this._entity === "PurchaseRequisitions" && field === "documentType") {
          box.addItem(inputs["_newMaterialName"]);
        }
      }.bind(this));

      var dialog = new Dialog({
        title: mode + " " + this._config.title,
        content: [box],
        beginButton: new Button({
          text: "Save",
          type: "Emphasized",
          press: async function () {
            var payload = {};
            if (this._entity === "PurchaseRequisitions" && inputs["documentType"] && inputs["documentType"].getSelectedKey() === "OTHER") {
              var newMatName = inputs["_newMaterialName"].getValue();
              if (!newMatName) {
                MessageBox.error("Please enter a new material name.");
                return;
              }
              var newMatNo = "MAT-" + Math.floor(Math.random() * 100000);
              try {
                await fetch("/odata/v4/p2p/Materials", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ materialNo: newMatNo, description: newMatName, status: "Active" })
                });
                payload["documentType"] = newMatNo;
              } catch (e) {
                MessageBox.error("Failed to create new material.");
                return;
              }
            }
            this._editableFields().forEach(function (field) {
              var value;
              if (this._entity === "PurchaseRequisitions" && field === "documentType") {
                if (inputs[field].getSelectedKey() === "OTHER") {
                  value = payload["documentType"];
                } else {
                  value = inputs[field].getSelectedKey();
                }
              } else if (["requestDate", "submissionDeadline", "documentDate", "deliveryDate", "postingDate", "invoiceDate", "runDate", "nextPaymentDate"].indexOf(field) !== -1) {
                value = inputs[field].getValue();
              } else {
                value = inputs[field].getValue();
              }
              if (value !== "" && value !== undefined) {
                payload[field] = value;
              }
            }.bind(this));
            await this._create(payload);
            dialog.close();
          }.bind(this)
        }),
        endButton: new Button({ text: "Cancel", press: function () { dialog.close(); } }),
        afterClose: function () { dialog.destroy(); }
      });

      dialog.open();
    },

    _create: async function (payload) {
      try {
        var response = await fetch("/odata/v4/p2p/" + this._entity, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Create failed.");
        }

        var responseData = await response.json();
        var newId = responseData.ID || (responseData.value && responseData.value.ID);

        MessageToast.show("Created");
        
        if (newId) {
          window.location.href = "/p2p-object-pages/index.html#/object/" + encodeURIComponent(this._entity) + "/" + encodeURIComponent(newId);
        } else {
          this._loadRows();
        }
      } catch (error) {
        MessageBox.error(error.message || "Create failed.");
      }
    },

    _editableFields: function () {
      var generated = GENERATED_FIELDS[this._entity] || [];

      return this._config.fields.filter(function (field) {
        return generated.indexOf(field) === -1;
      });
    }
  });
});
