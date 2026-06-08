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
  "p2p/common/Auth",
  "p2p/common/Header",
  "p2p/common/RoleAccess",
  "p2p/common/Navigation"
], function (Controller, JSONModel, Button, Column, ColumnListItem, Dialog, Input, Label, MessageBox, MessageToast, Text, VBox, Select, Item, Auth, Header, RoleAccess, Navigation) {
  "use strict";

  var ENTITY_CONFIG = {
    Vendors: { title: "Vendor Master", search: "Search vendors", fields: ["vendorNo", "name", "email", "telephone", "city", "purchOrg", "status"], columns: [["Vendor", "vendorNo"], ["Name", "name"], ["Email", "email"], ["Phone", "telephone"], ["Address", "city"], ["Company Code", "purchOrg"], ["Status", "status"]] },
    Materials: { title: "Material Master", search: "Search materials", fields: ["materialNo", "description", "materialGroup", "baseUom", "movingAvgPrice", "plant", "status"], columns: [["Material", "materialNo"], ["Description", "description"], ["Category", "materialGroup"], ["Unit", "baseUom"], ["Price", "movingAvgPrice"], ["Plant", "plant"], ["Status", "status"]] },
    PurchaseRequisitions: { title: "Purchase Requisitions", search: "Search PR number, status, requisitioner", fields: ["prNo", "requisitioner", "purchasingOrg", "documentType", "requestDate", "status", "totalItems"], columns: [["PR", "prNo"], ["Requisitioner", "requisitioner"], ["Purchasing Org", "purchasingOrg"], ["Status", "status"], ["Items", "totalItems"]] },
    RFQs: { title: "RFQs", search: "Search RFQ number or status", fields: ["rfqNo", "rfqType", "purchasingOrg", "purchasingGroup", "submissionDeadline", "status"], columns: [["RFQ", "rfqNo"], ["Type", "rfqType"], ["Purchasing Org", "purchasingOrg"], ["Deadline", "submissionDeadline"], ["Status", "status"]] },
    PurchaseOrders: { title: "Purchase Orders", search: "Search PO number, status, vendor", fields: ["poNo", "purchasingOrg", "purchasingGroup", "companyCode", "currency", "documentDate", "deliveryDate", "status", "totalNetValue"], columns: [["PO", "poNo"], ["Company Code", "companyCode"], ["Currency", "currency"], ["Delivery Date", "deliveryDate"], ["Status", "status"], ["Net Value", "totalNetValue"]] },
    InspectionLots: { title: "Inspection Lots", search: "Search lot number or status", fields: ["inspectionLotNo", "inspectionType", "lotQuantity", "acceptedQuantity", "rejectedQuantity", "usageDecisionCode", "rejectionReason", "status"], columns: [["Lot", "inspectionLotNo"], ["Type", "inspectionType"], ["Lot Qty", "lotQuantity"], ["Accepted", "acceptedQuantity"], ["Rejected", "rejectedQuantity"], ["Status", "status"]] },
    GoodsReceipts: { title: "Goods Receipts", search: "Search GR number, status, plant", fields: ["grNo", "postingDate", "documentDate", "plant", "storageLocation", "batch", "totalValue", "status"], columns: [["GR", "grNo"], ["Posting Date", "postingDate"], ["Plant", "plant"], ["Storage", "storageLocation"], ["Value", "totalValue"], ["Status", "status"]] },
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

  var STATUS_OPTIONS = {
    Users: ["Active", "Inactive"],
    Vendors: ["Active", "Blocked"],
    Materials: ["Active", "Blocked"],
    PurchaseRequisitions: ["CREATED", "SUBMITTED", "APPROVED", "REJECTED"],
    RFQs: ["DRAFT", "VENDORS_ASSIGNED", "ISSUED", "QUOTATIONS_RECEIVED", "VENDOR_SELECTED", "PO_CREATED"],
    PurchaseOrders: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SENT", "RECEIVED"],
    InspectionLots: ["OPEN", "PASSED", "FAILED"],
    GoodsReceipts: ["DRAFT", "POSTED", "REVERSED"],
    Invoices: ["DRAFT", "VERIFIED", "PAID"],
    PaymentRuns: ["DRAFT", "PAYMENT_POSTED", "FAILED"]
  };

  return Controller.extend("sap.cap.p2p.listobject.controller.Main", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth(Navigation.getAppUrl("LIST_OBJECT"))) {
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

      Navigation.navigate("OBJECT_PAGE", "#/object/" + encodeURIComponent(this._entity) + "/" + encodeURIComponent(id));
    },

    onCreate: function () {
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

        var currentRole = Auth.getSession().role;
        if (currentRole !== "P2P_ADMIN") {
          rows = rows.filter(function (row) {
            if (!row.hasOwnProperty("assignedRole")) return true;
            return row.assignedRole === currentRole || row.assignedRole === 'COMPLETED' || row.createdBy === Auth.getSession().userId;
          });
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
        if (field === "status" || field === "matchStatus" || field === "usageDecisionCode") {
          var select = new Select({ width: "100%", selectedKey: data[field] || "" });
          var statuses = [];
          if (field === "matchStatus") {
            statuses = ["Pending", "Matched", "Mismatch"];
          } else if (field === "usageDecisionCode") {
            statuses = ["", "PASS", "FAIL"];
          } else {
            statuses = STATUS_OPTIONS[this._entity] || ["Active", "Inactive"];
          }
          if (data[field] && statuses.indexOf(data[field]) === -1) {
            statuses = statuses.slice();
            statuses.push(data[field]);
          }
          statuses.forEach(function(s) {
            var text = s;
            if (s === "PASS") text = "Accept";
            if (s === "FAIL") text = "Reject";
            select.addItem(new Item({ key: s, text: text }));
          });
          inputs[field] = select;
        } else {
          inputs[field] = new Input({ value: data[field] || "" });
        }
        box.addItem(new Label({ text: field }));
        box.addItem(inputs[field]);
      }.bind(this));

      var dialog = new Dialog({
        title: mode + " " + this._config.title,
        content: [box],
        beginButton: new Button({
          text: "Save",
          type: "Emphasized",
          press: async function () {
            var payload = {};
            this._editableFields().forEach(function (field) {
              var value = (field === "status" || field === "matchStatus" || field === "usageDecisionCode") ? inputs[field].getSelectedKey() : inputs[field].getValue();
              if (value !== "") {
                payload[field] = value;
              }
            });
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
          Navigation.navigate("OBJECT_PAGE", "#/object/" + encodeURIComponent(this._entity) + "/" + encodeURIComponent(newId));
        } else {
          this._loadRows();
        }
      } catch (error) {
        MessageBox.error(error.message || "Create failed.");
      }
    },

    _editableFields: function () {
      var generated = (GENERATED_FIELDS[this._entity] || []).concat(["status"]);

      return this._config.fields.filter(function (field) {
        return generated.indexOf(field) === -1;
      });
    }
  });
});
