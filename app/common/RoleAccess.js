sap.ui.define([], function () {
  "use strict";

  var ALL_ROLES = [
    "Admin",
    "ProcurementOfficer",
    "FinanceOfficer",
    "QCInspector",
    "GoodsReceiptOfficer",
    "Viewer"
  ];

  var ROLE_PERMISSIONS = {
    ROUTES: {
      "/home/index.html": ALL_ROLES,
      "/p2p-list-object/index.html": ALL_ROLES,
      "/procurement-pages/index.html": ["Admin", "ProcurementOfficer"],
      "/p2p-object-pages/index.html": ALL_ROLES,
      "/p2p-transactional/index.html": ["Admin", "FinanceOfficer", "QCInspector", "GoodsReceiptOfficer", "Viewer"],
      "/p2p-analytical/index.html": ["Admin", "ProcurementOfficer", "FinanceOfficer", "Viewer"],
      "/user-management/index.html": ["Admin"],
      "/user-management/webapp/index.html": ["Admin"]
    },
    ENTITIES: {
      Users: {
        READ: ["Admin"],
        WRITE: ["Admin"]
      },
      Vendors: {
        READ: ["Admin", "ProcurementOfficer", "FinanceOfficer", "Viewer"],
        WRITE: ["Admin"]
      },
      Materials: {
        READ: ["Admin", "ProcurementOfficer", "Viewer"],
        WRITE: ["Admin"]
      },
      PurchaseRequisitions: {
        READ: ["Admin", "ProcurementOfficer", "Viewer"],
        WRITE: ["Admin", "ProcurementOfficer"]
      },
      RFQs: {
        READ: ["Admin", "ProcurementOfficer", "Viewer"],
        WRITE: ["Admin", "ProcurementOfficer"]
      },
      PurchaseOrders: {
        READ: ["Admin", "ProcurementOfficer", "Viewer"],
        WRITE: ["Admin", "ProcurementOfficer"]
      },
      InspectionLots: {
        READ: ["Admin", "QCInspector", "Viewer"],
        WRITE: ["Admin", "QCInspector"]
      },
      GoodsReceipts: {
        READ: ["Admin", "GoodsReceiptOfficer", "Viewer"],
        WRITE: ["Admin", "GoodsReceiptOfficer"]
      },
      Invoices: {
        READ: ["Admin", "FinanceOfficer", "Viewer"],
        WRITE: ["Admin", "FinanceOfficer"]
      },
      PaymentRuns: {
        READ: ["Admin", "FinanceOfficer", "Viewer"],
        WRITE: ["Admin", "FinanceOfficer"]
      },
      Analytics: {
        READ: ["Admin", "ProcurementOfficer", "FinanceOfficer", "Viewer"],
        WRITE: []
      }
    },
    ACTIONS: {
      submitPurchaseRequisition: ["Admin", "ProcurementOfficer"],
      approvePurchaseRequisition: ["Admin", "ProcurementOfficer"],
      createRFQFromPR: ["Admin", "ProcurementOfficer"],
      issueRFQ: ["Admin", "ProcurementOfficer"],
      createPOFromRFQ: ["Admin", "ProcurementOfficer"],
      approvePO: ["Admin", "ProcurementOfficer"],
      postUsageDecision: ["Admin", "QCInspector"],
      postGoodsReceipt: ["Admin", "GoodsReceiptOfficer"],
      runThreeWayMatch: ["Admin", "FinanceOfficer"],
      createPaymentAdvice: ["Admin", "FinanceOfficer"],
      executePaymentRun: ["Admin", "FinanceOfficer"]
    }
  };

  var HOME_TILES = [
    { title: "Vendors", description: "Supplier master data", icon: "sap-icon://supplier", entity: "Vendors", path: "/p2p-list-object/index.html?entity=Vendors" },
    { title: "Materials", description: "Material master data", icon: "sap-icon://product", entity: "Materials", path: "/p2p-list-object/index.html?entity=Materials" },
    { title: "Purchase Requisitions", description: "Request purchasing needs", icon: "sap-icon://request", entity: "PurchaseRequisitions", path: "/p2p-list-object/index.html?entity=PurchaseRequisitions" },
    { title: "RFQs", description: "Request supplier quotations", icon: "sap-icon://sales-quote", entity: "RFQs", path: "/p2p-list-object/index.html?entity=RFQs" },
    { title: "Purchase Orders", description: "Track purchasing documents", icon: "sap-icon://cart-3", entity: "PurchaseOrders", path: "/p2p-list-object/index.html?entity=PurchaseOrders" },
    { title: "Inspection Lots", description: "Quality inspection records", icon: "sap-icon://inspection", entity: "InspectionLots", path: "/p2p-list-object/index.html?entity=InspectionLots" },
    { title: "Goods Receipts", description: "Post and review receipts", icon: "sap-icon://shipping-status", entity: "GoodsReceipts", path: "/p2p-list-object/index.html?entity=GoodsReceipts" },
    { title: "Invoices", description: "Supplier invoice processing", icon: "sap-icon://receipt", entity: "Invoices", path: "/p2p-list-object/index.html?entity=Invoices" },
    { title: "Payment Runs", description: "Payment execution", icon: "sap-icon://payment-approval", entity: "PaymentRuns", path: "/p2p-list-object/index.html?entity=PaymentRuns" },
    { title: "Total Spend Analytics", description: "Vendor Spend, PO Spend & Procurement Insights", icon: "sap-icon://money-bills", entity: "Analytics", path: "/p2p-analytical/index.html" },
    { title: "Vendor Spend Analytics", description: "Spend grouped by vendor", icon: "sap-icon://bar-chart", entity: "Analytics", path: "/p2p-analytical/index.html" },
    { title: "User Management", description: "Users, roles and access control", icon: "sap-icon://group", entity: "Users", path: "/user-management/index.html" }
  ];

  function includes(roles, role) {
    return roles.indexOf(role) !== -1;
  }

  return {
    ALL_ROLES: ALL_ROLES,
    ROUTE_PERMISSIONS: ROLE_PERMISSIONS.ROUTES,
    ENTITY_PERMISSIONS: ROLE_PERMISSIONS.ENTITIES,
    ACTION_PERMISSIONS: ROLE_PERMISSIONS.ACTIONS,
    HOME_TILES: HOME_TILES,

    isRouteAllowed: function (path, role) {
      return includes(ROLE_PERMISSIONS.ROUTES[(path || "").split("?")[0]] || [], role);
    },

    canReadEntity: function (entity, role) {
      return includes((ROLE_PERMISSIONS.ENTITIES[entity] || {}).READ || [], role);
    },

    canWriteEntity: function (entity, role) {
      return includes((ROLE_PERMISSIONS.ENTITIES[entity] || {}).WRITE || [], role);
    },

    canExecuteAction: function (action, role) {
      return includes(ROLE_PERMISSIONS.ACTIONS[action] || [], role);
    },

    canAccess: function (type, name, operation, role) {
      if (type === "route") {
        return this.isRouteAllowed(name, role);
      }

      if (type === "entity") {
        return operation === "WRITE" ? this.canWriteEntity(name, role) : this.canReadEntity(name, role);
      }

      if (type === "action") {
        return this.canExecuteAction(name, role);
      }

      return false;
    },

    navigateIfAllowed: function (path) {
      var role = localStorage.getItem("userRole");

      if (!this.isRouteAllowed(path, role)) {
        window.alert("You do not have permission to access this page.");
        window.location.href = "/home/index.html";
        return;
      }

      window.location.href = path;
    },

    getHomeTiles: function (role) {
      return HOME_TILES.filter(function (tile) {
        return role === "Admin" || this.canReadEntity(tile.entity, role);
      }, this);
    }
  };
});
