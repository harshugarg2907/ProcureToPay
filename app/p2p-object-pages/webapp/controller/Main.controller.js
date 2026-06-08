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
  "p2p/common/RoleAccess"
], function (Controller, JSONModel, Button, Dialog, Input, Label, MessageBox, MessageToast, VBox, Auth, Header, RoleAccess) {
  "use strict";

  var ENTITY_CONFIG = {
    Users: {
      label: "User",
      titleField: "userId",
      backPath: "/user-management/index.html#/users",
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
      backPath: "/p2p-list-object/index.html?entity=Vendors",
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
      backPath: "/p2p-list-object/index.html?entity=Materials",
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
      backPath: "/p2p-list-object/index.html?entity=PurchaseRequisitions",
      fields: [["PR Number", "prNo"], ["Requisitioner", "requisitioner"], ["Purchasing Org", "purchasingOrg"], ["Document Type", "documentType"], ["Request Date", "requestDate"], ["Status", "status"], ["Total Items", "totalItems"]]
    },
    RFQs: {
      label: "RFQ",
      titleField: "rfqNo",
      backPath: "/p2p-list-object/index.html?entity=RFQs",
      fields: [["RFQ Number", "rfqNo"], ["RFQ Type", "rfqType"], ["Purchasing Org", "purchasingOrg"], ["Purchasing Group", "purchasingGroup"], ["Submission Deadline", "submissionDeadline"], ["Status", "status"]]
    },
    PurchaseOrders: {
      label: "Purchase Order",
      titleField: "poNo",
      backPath: "/p2p-list-object/index.html?entity=PurchaseOrders",
      fields: [["PO Number", "poNo"], ["Purchasing Org", "purchasingOrg"], ["Purchasing Group", "purchasingGroup"], ["Company Code", "companyCode"], ["Currency", "currency"], ["Document Date", "documentDate"], ["Delivery Date", "deliveryDate"], ["Status", "status"], ["Total Net Value", "totalNetValue"]]
    },
    InspectionLots: {
      label: "Inspection Lot",
      titleField: "inspectionLotNo",
      backPath: "/p2p-list-object/index.html?entity=InspectionLots",
      fields: [["Inspection Lot", "inspectionLotNo"], ["Inspection Type", "inspectionType"], ["Lot Quantity", "lotQuantity"], ["Accepted Quantity", "acceptedQuantity"], ["Rejected Quantity", "rejectedQuantity"], ["Usage Decision", "usageDecisionCode"], ["Rejection Reason", "rejectionReason"], ["Status", "status"]]
    },
    GoodsReceipts: {
      label: "Goods Receipt",
      titleField: "grNo",
      backPath: "/p2p-list-object/index.html?entity=GoodsReceipts",
      fields: [["GR Number", "grNo"], ["Posting Date", "postingDate"], ["Document Date", "documentDate"], ["Plant", "plant"], ["Storage Location", "storageLocation"], ["Batch", "batch"], ["Total GR Value", "totalGRValue"], ["Status", "status"]]
    },
    Invoices: {
      label: "Invoice",
      titleField: "invoiceNo",
      backPath: "/p2p-list-object/index.html?entity=Invoices",
      fields: [["Invoice Number", "invoiceNo"], ["Invoice Date", "invoiceDate"], ["Posting Date", "postingDate"], ["Currency", "currency"], ["Payment Terms", "paymentTerms"], ["Net Amount", "netAmount"], ["Tax Amount", "taxAmount"], ["Total Payable", "totalPayable"], ["Match Status", "matchStatus"], ["Status", "status"]]
    },
    PaymentRuns: {
      label: "Payment Run",
      titleField: "paymentRunId",
      backPath: "/p2p-list-object/index.html?entity=PaymentRuns",
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

  return Controller.extend("sap.cap.p2p.objectpages.controller.Main", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth("/p2p-object-pages/index.html")) {
        return;
      }

      this.getView().setModel(new JSONModel({
        pageTitle: "Object Detail",
        title: "Object Detail",
        subtitle: "",
        entity: "",
        id: "",
        fields: []
      }), "detail");
      Auth.applyAuthHeader(this.getOwnerComponent().getModel());
      Header.apply(this, "Object Detail");
      this._loadFromHash();
    },

    onBack: function () {
      var entity = this.getView().getModel("detail").getProperty("/entity");
      var config = ENTITY_CONFIG[entity];

      window.location.href = config ? config.backPath : "/home/index.html";
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

    onSubmitPR: function () { this._invokeAction("submitPurchaseRequisition", "prId"); },
    onApprovePR: function () { this._invokeAction("approvePurchaseRequisition", "prId"); },
    onIssueRFQ: function () { this._invokeAction("issueRFQ", "rfqId"); },
    onCreatePO: function () { this._invokeAction("createPOFromRFQ", "rfqId"); },
    onApprovePO: function () { this._invokeAction("approvePO", "poId"); },
    onPostUsageDecision: function () { this._invokeAction("postUsageDecision", "lotId"); },
    onPostGoodsReceipt: function () { this._invokeAction("postGoodsReceipt", "lotId"); },
    onRunThreeWayMatch: function () { this._invokeAction("runThreeWayMatch", "invoiceId"); },
    onCreatePaymentAdvice: function () { this._invokeAction("createPaymentAdvice", "invoiceId"); },
    onExecutePaymentRun: function () { this._invokeAction("executePaymentRun", "paymentRunId"); },
    onReject: function () { this._updateObject({ status: "Rejected" }); },

    _loadFromHash: async function () {
      var route = this._parseHash();
      var config = ENTITY_CONFIG[route.entity];

      if (!route.entity || !route.id || !config) {
        MessageBox.error("Missing or invalid object route.", {
          onClose: function () {
            window.location.href = "/home/index.html";
          }
        });
        return;
      }

      try {
        var object = await this._readObject(route.entity, route.id);

        if (!object) {
          MessageBox.error("Selected record was not found.", {
            onClose: function () {
              window.location.href = config.backPath;
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
        return {
          label: field[0],
          value: object[field[1]]
        };
      }).filter(function (field) {
        return field.value !== undefined && field.value !== null && field.value !== "";
      });

      this.getView().getModel("detail").setData({
        pageTitle: config.label + " Detail",
        title: config.label + " -> " + titleValue,
        subtitle: entity + " | " + id,
        entity: entity,
        id: id,
        object: object,
        fields: fields,
        canEdit: RoleAccess.canWriteEntity(entity, role),
        canDelete: role === "P2P_ADMIN",
        actions: this._getActions(entity, role)
      });
      this.byId("objectPage").setTitle(config.label + " Detail");
    },

    _getActions: function (entity, role) {
      return {
        submitPR: entity === "PurchaseRequisitions" && RoleAccess.canExecuteAction("submitPurchaseRequisition", role),
        approvePR: entity === "PurchaseRequisitions" && RoleAccess.canExecuteAction("approvePurchaseRequisition", role),
        reject: ["PurchaseRequisitions", "PurchaseOrders", "InspectionLots", "Invoices"].indexOf(entity) !== -1 && RoleAccess.canWriteEntity(entity, role),
        issueRFQ: entity === "RFQs" && RoleAccess.canExecuteAction("issueRFQ", role),
        createPO: entity === "RFQs" && RoleAccess.canExecuteAction("createPOFromRFQ", role),
        approvePO: entity === "PurchaseOrders" && RoleAccess.canExecuteAction("approvePO", role),
        postUsageDecision: entity === "InspectionLots" && RoleAccess.canExecuteAction("postUsageDecision", role),
        postGoodsReceipt: entity === "GoodsReceipts" && RoleAccess.canExecuteAction("postGoodsReceipt", role),
        runThreeWayMatch: entity === "Invoices" && RoleAccess.canExecuteAction("runThreeWayMatch", role),
        createPaymentAdvice: entity === "Invoices" && RoleAccess.canExecuteAction("createPaymentAdvice", role),
        executePaymentRun: entity === "PaymentRuns" && RoleAccess.canExecuteAction("executePaymentRun", role)
      };
    },

    _entityUrl: function (entity, id) {
      return "/odata/v4/p2p/" + encodeURIComponent(entity) + "(ID=" + encodeURIComponent(id) + ")";
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

    _invokeAction: async function (actionName, parameterName) {
      var detail = this.getView().getModel("detail").getData();
      var payload = {};

      payload[parameterName] = detail.id;
      if (actionName === "createPOFromRFQ") {
        MessageBox.information("Select-vendor flow is not available on this object page yet.");
        return;
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

      MessageToast.show("Action completed");
      this._loadFromHash();
    }
  });
});
