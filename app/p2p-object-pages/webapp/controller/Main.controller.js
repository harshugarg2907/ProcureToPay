sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/Button",
  "sap/m/Dialog",
  "sap/m/Input",
  "sap/m/Label",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/m/VBox",
  "p2p/common/Auth",
  "p2p/common/Header",
  "p2p/common/RoleAccess",
  "p2p/common/Navigation"
], function (Controller, JSONModel, Button, Dialog, Input, Label, MessageBox, MessageToast, VBox, Auth, Header, RoleAccess, Navigation) {
  "use strict";

  var ENTITY_CONFIG = {
    Users: {
      label: "User",
      titleField: "userId",
      backApp: "USER_MANAGEMENT", backParams: "#/users",
      fields: [
        ["User ID", "userId"],
        ["Full Name", "fullName"],
        ["Email", "email"],
        ["Company Code", "companyCode"],
        ["Cost Center", "costCenter"],
        ["Language", "language"],
        ["Status", "status"],
        ["Created At", "createdAt"],
        ["Created By", "createdBy"],
        ["Modified At", "modifiedAt"],
        ["Modified By", "modifiedBy"]
      ]
    },
    Vendors: {
      label: "Vendor",
      titleField: "name",
      backApp: "LIST_OBJECT", backParams: "?entity=Vendors",
      fields: [
        ["Name", "name"],
        ["Email", "email"],
        ["Phone", "telephone"],
        ["Address", "city"],
        ["Company Code", "purchOrg"],
        ["Status", "status"],
        ["Created At", "createdAt"],
        ["Created By", "createdBy"],
        ["Modified At", "modifiedAt"],
        ["Modified By", "modifiedBy"]
      ]
    },
    Materials: {
      label: "Material",
      titleField: "materialNo",
      backApp: "LIST_OBJECT", backParams: "?entity=Materials",
      fields: [
        ["Material", "materialNo"],
        ["Description", "description"],
        ["Category", "materialGroup"],
        ["Unit", "baseUom"],
        ["Price", "movingAvgPrice"],
        ["Plant", "plant"],
        ["Status", "status"]
      ]
    },
    PurchaseRequisitions: {
      label: "Purchase Requisition",
      titleField: "prNo",
      backApp: "LIST_OBJECT", backParams: "?entity=PurchaseRequisitions",
      fields: [["PR Number", "prNo"], ["Requisitioner", "requisitioner"], ["Purchasing Org", "purchasingOrg"], ["Document Type", "documentType"], ["Request Date", "requestDate"], ["Status", "status"], ["Total Items", "totalItems"]]
    },
    RFQs: {
      label: "RFQ",
      titleField: "rfqNo",
      backApp: "LIST_OBJECT", backParams: "?entity=RFQs",
      fields: [["RFQ Number", "rfqNo"], ["Source PR", "sourcePR/prNo"], ["RFQ Type", "rfqType"], ["Purchasing Org", "purchasingOrg"], ["Purchasing Group", "purchasingGroup"], ["Submission Deadline", "submissionDeadline"], ["Status", "status"]]
    },
    PurchaseOrders: {
      label: "Purchase Order",
      titleField: "poNo",
      backApp: "LIST_OBJECT", backParams: "?entity=PurchaseOrders",
      fields: [["PO Number", "poNo"], ["Source RFQ", "sourceRFQ/rfqNo"], ["Source PR", "sourcePR/prNo"], ["Vendor", "vendor/name"], ["Purchasing Org", "purchasingOrg"], ["Purchasing Group", "purchasingGroup"], ["Company Code", "companyCode"], ["Currency", "currency"], ["Document Date", "documentDate"], ["Delivery Date", "deliveryDate"], ["Status", "status"], ["Total Net Value", "totalNetValue"]]
    },
    InspectionLots: {
      label: "Inspection Lot",
      titleField: "inspectionLotNo",
      backApp: "LIST_OBJECT", backParams: "?entity=InspectionLots",
      fields: [["Inspection Lot", "inspectionLotNo"], ["PO Number", "purchaseOrder/poNo"], ["Vendor", "vendor/name"], ["Inspection Type", "inspectionType"], ["Lot Quantity", "lotQuantity"], ["Accepted Quantity", "acceptedQuantity"], ["Rejected Quantity", "rejectedQuantity"], ["Usage Decision", "usageDecisionCode"], ["Rejection Reason", "rejectionReason"], ["Status", "status"]]
    },
    GoodsReceipts: {
      label: "Goods Receipt",
      titleField: "grNo",
      backApp: "LIST_OBJECT", backParams: "?entity=GoodsReceipts",
      fields: [["GR Number", "grNo"], ["PO Number", "purchaseOrder/poNo"], ["Posting Date", "postingDate"], ["Document Date", "documentDate"], ["Plant", "plant"], ["Storage Location", "storageLocation"], ["Batch", "batch"], ["Total GR Value", "totalGRValue"], ["Status", "status"]]
    },
    Invoices: {
      label: "Invoice",
      titleField: "invoiceNo",
      backApp: "LIST_OBJECT", backParams: "?entity=Invoices",
      fields: [["Invoice Number", "invoiceNo"], ["PO Number", "purchaseOrder/poNo"], ["GR Number", "goodsReceipt/grNo"], ["Vendor", "vendor/name"], ["Invoice Date", "invoiceDate"], ["Posting Date", "postingDate"], ["Currency", "currency"], ["Payment Terms", "paymentTerms"], ["Net Amount", "netAmount"], ["Tax Amount", "taxAmount"], ["Total Payable", "totalPayable"], ["Match Status", "matchStatus"], ["Status", "status"]]
    },
    PaymentRuns: {
      label: "Payment Run",
      titleField: "paymentRunId",
      backApp: "LIST_OBJECT", backParams: "?entity=PaymentRuns",
      fields: [["Payment Run ID", "paymentRunId"], ["Run Date", "runDate"], ["Company Code", "companyCode"], ["Payment Method", "paymentMethod"], ["Next Payment Date", "nextPaymentDate"], ["Status", "status"], ["Total Payment Amount", "totalPaymentAmount"]]
    }
  };
  var READ_ONLY_FIELDS = {
    Users: ["userId", "createdAt", "createdBy", "modifiedAt", "modifiedBy"],
    Vendors: ["vendorNo", "createdAt", "createdBy", "modifiedAt", "modifiedBy"],
    Materials: ["materialNo"],
    PurchaseRequisitions: ["prNo"],
    RFQs: ["rfqNo"],
    PurchaseOrders: ["poNo"],
    InspectionLots: ["inspectionLotNo"],
    GoodsReceipts: ["grNo"],
    Invoices: ["invoiceNo"],
    PaymentRuns: ["paymentRunId"]
  };

  var ITEMS_CONFIG = {
    PurchaseRequisitions: "items",
    RFQs: "vendors,items,sourcePR",
    PurchaseOrders: "items,sourceRFQ,sourcePR,vendor",
    InspectionLots: "characteristics,purchaseOrder,material,vendor",
    GoodsReceipts: "items,purchaseOrder,inspectionLot",
    Invoices: "vendor,purchaseOrder,goodsReceipt",
    PaymentRuns: "items"
  };

  return Controller.extend("sap.cap.p2p.objectpages.controller.Main", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth(Navigation.getAppUrl("OBJECT_PAGE"))) {
        return;
      }

      this.getView().setModel(new JSONModel({
        pageTitle: "Object Detail",
        title: "Object Detail",
        subtitle: "",
        entity: "",
        id: "",
        fields: [],
        items: [],
        hasItems: false
      }), "detail");
      Auth.applyAuthHeader(this.getOwnerComponent().getModel());
      Header.apply(this, "Object Detail");
      this._loadFromHash();
    },

    formatJSON: function (data) {
      if (!data) return "";
      return data.map(function(item, index) {
        var parts = [];
        for(var key in item) {
          if (item[key] !== null && typeof item[key] !== 'object' && key !== 'ID' && key !== 'IsActiveEntity' && key !== 'HasActiveEntity' && key !== 'createdAt' && key !== 'createdBy' && key !== 'modifiedAt' && key !== 'modifiedBy') {
             parts.push(key + ": " + item[key]);
          }
        }
        return "[" + (index + 1) + "] " + parts.join(" | ");
      }).join("\n\n");
    },

    onBack: function () {
      var entity = this.getView().getModel("detail").getProperty("/entity");
      var config = ENTITY_CONFIG[entity];

      if (config && config.backApp) {
        Navigation.navigate(config.backApp, config.backParams);
      } else {
        Navigation.navigate("HOME");
      }
    },

    onEdit: function () {
      var model = this.getView().getModel("detail");
      var data = model.getData();
      var config = ENTITY_CONFIG[data.entity];
      var inputs = {};
      var box = new VBox({ class: "sapUiSmallMargin p2pDialogForm", width: "24rem" });

      this._editableFields(data.entity, config).forEach(function (field) {
        var name = field[1];
        inputs[name] = new Input({ value: data.object[name] || "" });
        box.addItem(new Label({ text: field[0] }));
        box.addItem(inputs[name]);
      });

      var dialog = new Dialog({
        title: "Edit " + config.label,
        content: [box],
        beginButton: new Button({
          text: "Update",
          type: "Emphasized",
          press: async function () {
            var payload = {};
            this._editableFields(data.entity, config).forEach(function (field) {
              var name = field[1];
              var value = inputs[name].getValue();
              if (value !== "") {
                payload[name] = value;
              }
            });
            await this._updateObject(payload);
            dialog.close();
          }.bind(this)
        }),
        endButton: new Button({ text: "Cancel", press: function () { dialog.close(); } }),
        afterClose: function () { dialog.destroy(); }
      });

      dialog.open();
    },

    onDelete: function () {
      MessageBox.confirm("Delete this record?", {
        onClose: async function (action) {
          if (action === MessageBox.Action.OK) {
            await this._deleteObject();
          }
        }.bind(this)
      });
    },

    onSubmitPR: function () { this._invokeAction("submitPurchaseRequisition", "prId", {}); },
    onApprovePR: function () { this._invokeAction("approvePurchaseRequisition", "prId", { comments: "Approved" }); },
    
    onAddVendor: function () { 
      this._openActionDialog("Add Vendor", [{ label: "Vendor ID", id: "rfqVendor", type: "string" }], "addVendorToRFQ", "rfqId", ["vendorId"]); 
    },
    onIssueRFQ: function () { this._invokeAction("issueRFQ", "rfqId", {}); },
    onReceiveQuotation: function () { 
      this._openActionDialog("Receive Quotation", [
        { label: "Vendor ID", id: "quotVendor", type: "string" },
        { label: "Quoted Amount", id: "quotAmount", type: "number" },
        { label: "Lead Time (Days)", id: "quotLeadTime", type: "number" },
        { label: "Remarks", id: "quotRemarks", type: "string" }
      ], "receiveQuotation", "rfqId", ["vendorId", "quotedAmount", "leadTime", "remarks"]); 
    },
    onSelectVendor: function () { 
      this._openActionDialog("Select Vendor", [{ label: "Vendor ID", id: "selVendor", type: "string" }], "selectVendor", "rfqId", ["vendorId"]); 
    },
    onCreatePO: function () {
      this._openActionDialog("Create PO", [
        { label: "Delivery Date", id: "poDate", type: "date" },
        { label: "Currency", id: "poCurrency", type: "string", value: "USD" },
        { label: "Company Code", id: "poComp", type: "string", value: "1000" },
        { label: "Purchasing Org", id: "poPorg", type: "string", value: "P001" },
        { label: "Purchasing Group", id: "poPgrp", type: "string", value: "G01" }
      ], "createOrGetPOFromRFQ", "rfqId", ["deliveryDate", "currency", "companyCode", "purchasingOrg", "purchasingGroup"]);
    },

    onSubmitPO: function () { this._invokeAction("submitPO", "poId", {}); },
    onApprovePO: function () { this._invokeAction("approvePO", "poId", { comments: "Approved" }); },
    
    onPostGoodsReceipt: function () { 
      this._openActionDialog("Post Goods Receipt", [
        { label: "Posting Date", id: "grDate", type: "date" },
        { label: "Document Date", id: "grDocDate", type: "date" },
        { label: "Plant", id: "grPlant", type: "string", value: "1000" },
        { label: "Storage Location", id: "grLoc", type: "string", value: "RM01" },
        { label: "Batch", id: "grBatch", type: "string" },
        { label: "Received Qty", id: "grQty", type: "number" }
      ], "postGoodsReceipt", "grId", ["postingDate", "documentDate", "plant", "storageLocation", "batch", "receivedQuantity"]); 
    },

    onPostUsageDecision: function () { 
      this._openActionDialog("Post Usage Decision", [
        { label: "Accepted Qty", id: "qcAccept", type: "number" },
        { label: "Rejected Qty", id: "qcReject", type: "number" },
        { label: "Decision Code (PASS/FAIL)", id: "qcDecision", type: "string" }
      ], "postUsageDecision", "lotId", ["acceptedQuantity", "rejectedQuantity", "usageDecisionCode"]); 
    },
    
    onVerifyInvoice: function () { this._invokeAction("verifyInvoice", "invoiceId", {}); },
    
    onExecutePaymentRun: function () { this._invokeAction("executePaymentRun", "paymentRunId", {}); },
    onReject: function () { this._updateObject({ status: "Rejected" }); },

    _openActionDialog: function (title, fields, actionName, paramName, payloadKeys) {
      var box = new VBox({ class: "sapUiSmallMargin" });
      var inputs = {};
      
      fields.forEach(function(f) {
        box.addItem(new Label({ text: f.label }));
        if (f.type === "date") {
          inputs[f.id] = new sap.m.DatePicker({ valueFormat: "yyyy-MM-dd", displayFormat: "yyyy-MM-dd" });
        } else if (f.type === "number") {
          inputs[f.id] = new Input({ type: "Number", value: f.value !== undefined ? f.value : "" });
        } else {
          inputs[f.id] = new Input({ value: f.value !== undefined ? f.value : "" });
        }
        box.addItem(inputs[f.id]);
      });

      var dialog = new Dialog({
        title: title,
        content: [box],
        beginButton: new Button({
          text: "Confirm",
          type: "Emphasized",
          press: function () {
            var payload = {};
            fields.forEach(function(f, idx) {
              var key = payloadKeys[idx];
              if (f.type === "date") {
                payload[key] = inputs[f.id].getValue();
              } else if (f.type === "number") {
                payload[key] = parseFloat(inputs[f.id].getValue()) || 0;
              } else {
                payload[key] = inputs[f.id].getValue();
              }
            });
            this._invokeAction(actionName, paramName, payload);
            dialog.close();
          }.bind(this)
        }),
        endButton: new Button({ text: "Cancel", press: function () { dialog.close(); } }),
        afterClose: function () { dialog.destroy(); }
      });
      dialog.open();
    },

    _loadFromHash: async function () {
      var route = this._parseHash();
      var config = ENTITY_CONFIG[route.entity];

      if (!route.entity || !route.id || !config) {
        MessageBox.error("Missing or invalid object route.", {
          onClose: function () {
            Navigation.navigate("HOME");
          }
        });
        return;
      }

      try {
        var object = await this._readObject(route.entity, route.id);

        if (!object) {
          MessageBox.error("Selected record was not found.", {
            onClose: function () {
              if (config && config.backApp) {
                Navigation.navigate(config.backApp, config.backParams);
              } else {
                Navigation.navigate("HOME");
              }
            }
          });
          return;
        }

        this._setDetail(route.entity, route.id, object, config);
      } catch (error) {
        MessageBox.error(error.message || "Unable to load selected record.");
      }
    },

    _parseHash: function () {
      var match = window.location.hash.match(/^#\/object\/([^/]+)\/([^/]+)/);

      return {
        entity: match && decodeURIComponent(match[1]),
        id: match && decodeURIComponent(match[2])
      };
    },

    _readObject: async function (entity, id) {
      var response = await fetch(this._entityUrl(entity, id));

      if (!response.ok) {
        response = await fetch("/odata/v4/p2p/" + encodeURIComponent(entity));

        if (!response.ok) {
          throw new Error("Unable to load selected record.");
        }

        var listData = await response.json();
        return (listData.value || []).find(function (row) {
          return row.ID === id;
        });
      }

      return response.json();
    },

    _setDetail: function (entity, id, object, config) {
      var role = Auth.getSession().role;
      var titleValue = object[config.titleField] || id;
      var fields = config.fields.map(function (field) {
        var val;
        if (field[1].indexOf('/') !== -1) {
          var parts = field[1].split('/');
          val = object;
          for (var i = 0; i < parts.length; i++) {
            if (val) val = val[parts[i]];
          }
        } else {
          val = object[field[1]];
        }
        return {
          label: field[0],
          value: object[field[1]]
          value: val
        };
      }).filter(function (field) {
        return field.value !== undefined && field.value !== null && field.value !== "";
      });

      var dynamicLists = [];
      if (object.items && object.items.length > 0) dynamicLists.push({ title: "Items", data: object.items });
      if (object.vendors && object.vendors.length > 0) dynamicLists.push({ title: "Vendors", data: object.vendors });
      if (object.characteristics && object.characteristics.length > 0) dynamicLists.push({ title: "Characteristics", data: object.characteristics });

      this.getView().getModel("detail").setData({
        pageTitle: config.label + " Detail",
        title: config.label + " -> " + titleValue,
        subtitle: entity + " | " + id,
        entity: entity,
        id: id,
        object: object,
        fields: fields,
        dynamicLists: dynamicLists,
        hasDynamicLists: dynamicLists.length > 0,
        canEdit: RoleAccess.canWriteEntity(entity, role),
        canDelete: role === "P2P_ADMIN",
        actions: this._getActions(entity, role, object.status)
      });
      this.byId("objectPage").setTitle(config.label + " Detail");
    },

    _getActions: function (entity, role, status) {
      return {
        submitPR: entity === "PurchaseRequisitions" && status === "CREATED" && RoleAccess.canExecuteAction("submitPurchaseRequisition", role),
        approvePR: entity === "PurchaseRequisitions" && status === "SUBMITTED" && RoleAccess.canExecuteAction("approvePurchaseRequisition", role),
        
        addVendor: entity === "RFQs" && (status === "DRAFT" || status === "VENDORS_ASSIGNED") && RoleAccess.canExecuteAction("addVendorToRFQ", role),
        issueRFQ: entity === "RFQs" && status === "VENDORS_ASSIGNED" && RoleAccess.canExecuteAction("issueRFQ", role),
        receiveQuotation: entity === "RFQs" && (status === "ISSUED" || status === "QUOTATIONS_RECEIVED") && RoleAccess.canExecuteAction("receiveQuotation", role),
        selectVendor: entity === "RFQs" && status === "QUOTATIONS_RECEIVED" && RoleAccess.canExecuteAction("selectVendor", role),
        createPO: entity === "RFQs" && status === "VENDOR_SELECTED" && RoleAccess.canExecuteAction("createOrGetPOFromRFQ", role),
        
        submitPO: entity === "PurchaseOrders" && status === "DRAFT" && RoleAccess.canExecuteAction("submitPO", role),
        approvePO: entity === "PurchaseOrders" && status === "PENDING_APPROVAL" && RoleAccess.canExecuteAction("approvePO", role),
        postGoodsReceipt: entity === "GoodsReceipts" && status === "DRAFT" && RoleAccess.canExecuteAction("postGoodsReceipt", role),
        postUsageDecision: entity === "InspectionLots" && status === "OPEN" && RoleAccess.canExecuteAction("postUsageDecision", role),
        verifyInvoice: entity === "Invoices" && (status === "CREATED" || status === "DRAFT") && RoleAccess.canExecuteAction("verifyInvoice", role),
        executePaymentRun: entity === "PaymentRuns" && (status === "CREATED" || status === "DRAFT") && RoleAccess.canExecuteAction("executePaymentRun", role),
        reject: ["PurchaseRequisitions", "PurchaseOrders", "Invoices"].indexOf(entity) !== -1 && (status === "PENDING_APPROVAL" || status === "CREATED" || status === "SUBMITTED") && RoleAccess.canWriteEntity(entity, role)
      };
    },

    _entityUrl: function (entity, id) {
      var url = "/odata/v4/p2p/" + encodeURIComponent(entity) + "(" + encodeURIComponent(id) + ")";
      if (ITEMS_CONFIG[entity]) {
        url += "?$expand=" + ITEMS_CONFIG[entity];
      }
      return url;
    },

    _editableFields: function (entity, config) {
      var readOnly = READ_ONLY_FIELDS[entity] || [];

      return config.fields.filter(function (field) {
        return readOnly.indexOf(field[1]) === -1;
      });
    },

    _updateObject: async function (payload) {
      var detail = this.getView().getModel("detail").getData();
      var response = await fetch(this._entityUrl(detail.entity, detail.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        MessageBox.error("Update failed.");
        return;
      }

      MessageToast.show("Updated");
      this._loadFromHash();
    },

    _deleteObject: async function () {
      var detail = this.getView().getModel("detail").getData();
      var response = await fetch(this._entityUrl(detail.entity, detail.id), { method: "DELETE" });

      if (!response.ok) {
        MessageBox.error("Delete failed.");
        return;
      }

      MessageToast.show("Deleted");
      this.onBack();
    },

    _invokeAction: async function (actionName, parameterName, extendPayload) {
      var detail = this.getView().getModel("detail").getData();
      var payload = {};

      payload[parameterName] = detail.id;
      if (extendPayload) {
        for (var k in extendPayload) {
          payload[k] = extendPayload[k];
        }
      }

      var response = await fetch("/odata/v4/p2p/" + actionName, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        MessageBox.error("Action failed.");
        return;
      }

      try {
        var responseText = await response.text();
        var jsonResponse = responseText ? JSON.parse(responseText) : {};
        if (jsonResponse.value) jsonResponse = JSON.parse(jsonResponse.value);
        
        if (jsonResponse.message) {
          var msg = jsonResponse.message;
          if (jsonResponse.nextAssignedRole && jsonResponse.nextAssignedRole !== "NONE" && jsonResponse.nextAssignedRole !== "COMPLETED") {
            msg += "\n\nTask forwarded to: " + jsonResponse.nextAssignedRole;
          }
          MessageBox.success(msg);
        } else {
          MessageToast.show("Action completed");
        }
      } catch (e) {
        MessageToast.show("Action completed");
      }

      this._loadFromHash();
    }
  });
});
