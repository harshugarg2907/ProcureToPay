sap.ui.define([], function () {
  "use strict";

  var ROLES = {
    ADMIN: "P2P_ADMIN",
    BUYER: "P2P_BUYER",
    REQUESTER: "P2P_REQUESTER",
    VENDOR_MANAGER: "P2P_VENDOR_MANAGER",
    QUALITY_INSPECTOR: "P2P_QUALITY_INSPECTOR",
    AP_CLERK: "P2P_AP_CLERK",
    FINANCE_MANAGER: "P2P_FINANCE_MANAGER"
  };
  var ALL_ROLES = Object.keys(ROLES).map(function (key) {
    return ROLES[key];
  });

  var ROLE_PERMISSIONS = {
    ROUTES: {
      "/home/index.html": ALL_ROLES,
      "/p2p-list-object/index.html": ALL_ROLES,
      "/procurement-pages/index.html": [ROLES.ADMIN, ROLES.BUYER, ROLES.REQUESTER],
      "/p2p-object-pages/index.html": ALL_ROLES,
      "/p2p-transactional/index.html": [ROLES.ADMIN, ROLES.QUALITY_INSPECTOR, ROLES.AP_CLERK, ROLES.FINANCE_MANAGER],
      "/p2p-analytical/index.html": [ROLES.ADMIN, ROLES.BUYER, ROLES.FINANCE_MANAGER],
      "/user-management/index.html": [ROLES.ADMIN],
      "/user-management/webapp/index.html": [ROLES.ADMIN]
    },
    ENTITIES: {
      Users: {
        READ: [ROLES.ADMIN],
        WRITE: [ROLES.ADMIN]
      },
      Vendors: {
        READ: [ROLES.ADMIN, ROLES.BUYER, ROLES.VENDOR_MANAGER, ROLES.AP_CLERK, ROLES.FINANCE_MANAGER],
        WRITE: [ROLES.ADMIN, ROLES.VENDOR_MANAGER]
      },
      Materials: {
        READ: [ROLES.ADMIN, ROLES.BUYER, ROLES.VENDOR_MANAGER],
        WRITE: [ROLES.ADMIN, ROLES.BUYER]
      },
      PurchaseRequisitions: {
        READ: [ROLES.ADMIN, ROLES.BUYER, ROLES.REQUESTER],
        WRITE: [ROLES.ADMIN, ROLES.BUYER, ROLES.REQUESTER]
      },
      RFQs: {
        READ: [ROLES.ADMIN, ROLES.BUYER],
        WRITE: [ROLES.ADMIN, ROLES.BUYER]
      },
      PurchaseOrders: {
        READ: [ROLES.ADMIN, ROLES.BUYER, ROLES.AP_CLERK, ROLES.FINANCE_MANAGER],
        WRITE: [ROLES.ADMIN, ROLES.BUYER]
      },
      InspectionLots: {
        READ: [ROLES.ADMIN, ROLES.QUALITY_INSPECTOR, ROLES.BUYER],
        WRITE: [ROLES.ADMIN, ROLES.QUALITY_INSPECTOR]
      },
      GoodsReceipts: {
        READ: [ROLES.ADMIN, ROLES.BUYER, ROLES.AP_CLERK, ROLES.QUALITY_INSPECTOR],
        WRITE: [ROLES.ADMIN, ROLES.BUYER]
      },
      Invoices: {
        READ: [ROLES.ADMIN, ROLES.AP_CLERK, ROLES.FINANCE_MANAGER],
        WRITE: [ROLES.ADMIN, ROLES.AP_CLERK, ROLES.FINANCE_MANAGER]
      },
      PaymentRuns: {
        READ: [ROLES.ADMIN, ROLES.AP_CLERK, ROLES.FINANCE_MANAGER],
        WRITE: [ROLES.ADMIN, ROLES.FINANCE_MANAGER]
      },
      Analytics: {
        READ: [ROLES.ADMIN, ROLES.BUYER, ROLES.FINANCE_MANAGER],
        WRITE: []
      }
    },
    ACTIONS: {
      submitPurchaseRequisition: [ROLES.ADMIN, ROLES.REQUESTER, ROLES.BUYER],
      approvePurchaseRequisition: [ROLES.ADMIN, ROLES.BUYER],
      createRFQFromPR: [ROLES.ADMIN, ROLES.BUYER],
      addVendorToRFQ: [ROLES.ADMIN, ROLES.BUYER, ROLES.VENDOR_MANAGER],
      issueRFQ: [ROLES.ADMIN, ROLES.BUYER],
      receiveQuotation: [ROLES.ADMIN, ROLES.BUYER, ROLES.VENDOR_MANAGER],
      selectVendor: [ROLES.ADMIN, ROLES.BUYER, ROLES.VENDOR_MANAGER],
      createPOFromRFQ: [ROLES.ADMIN, ROLES.BUYER],
      submitPO: [ROLES.ADMIN, ROLES.BUYER],
      approvePO: [ROLES.ADMIN, ROLES.BUYER],
      postUsageDecision: [ROLES.ADMIN, ROLES.QUALITY_INSPECTOR],
      postGoodsReceipt: [ROLES.ADMIN, ROLES.BUYER],
      runThreeWayMatch: [ROLES.ADMIN, ROLES.AP_CLERK],
      createPaymentAdvice: [ROLES.ADMIN, ROLES.AP_CLERK],
      verifyInvoice: [ROLES.ADMIN, ROLES.FINANCE_MANAGER, ROLES.AP_CLERK],
      executePaymentRun: [ROLES.ADMIN, ROLES.FINANCE_MANAGER]
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
    { title: "User Management", description: "User profiles; roles are assigned in BTP", icon: "sap-icon://group", entity: "Users", path: "/user-management/index.html" }
  ];

  function includes(roles, role) {
    return roles.indexOf(role) !== -1;
  }

  return {
    ROLES: ROLES,
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
        return role === ROLES.ADMIN || this.canReadEntity(tile.entity, role);
      }, this);
    }
  };
});
