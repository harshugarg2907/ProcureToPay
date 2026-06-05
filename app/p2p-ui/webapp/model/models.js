sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (JSONModel, Device) {
  "use strict";

  const roleRoutes = {
    Admin: ['launchpad','profile','purchaseRequisition','rfq','vendors','materials','purchaseOrders','qualityInspection','goodsReceipt','invoice','paymentRun','analytics'],
    ProcurementOfficer: ['launchpad','profile','purchaseRequisition','rfq','vendors','materials','purchaseOrders','analytics'],
    QCInspector: ['launchpad','profile','qualityInspection','analytics'],
    GoodsReceiptOfficer: ['launchpad','profile','goodsReceipt','analytics'],
    FinanceOfficer: ['launchpad','profile','invoice','paymentRun','analytics'],
    Viewer: ['launchpad','profile','analytics']
  };

  const users = {
    admin: { userId: 'admin', fullName: 'System Administrator', email: 'admin@p2p.example', companyCode: '1000', costCenter: 'CC100', language: 'EN', status: 'Active', roles: ['Admin'] },
    jsmith: { userId: 'jsmith', fullName: 'John Smith', email: 'jsmith@p2p.example', companyCode: '1000', costCenter: 'CC200', language: 'EN', status: 'Active', roles: ['ProcurementOfficer'] },
    qinspector: { userId: 'qinspector', fullName: 'Quality Inspector', email: 'qinspector@p2p.example', companyCode: '1000', costCenter: 'CC300', language: 'EN', status: 'Active', roles: ['QCInspector'] },
    grofficer: { userId: 'grofficer', fullName: 'Goods Receipt Officer', email: 'grofficer@p2p.example', companyCode: '1000', costCenter: 'CC400', language: 'EN', status: 'Active', roles: ['GoodsReceiptOfficer'] },
    finance: { userId: 'finance', fullName: 'Finance Officer', email: 'finance@p2p.example', companyCode: '1000', costCenter: 'CC500', language: 'EN', status: 'Active', roles: ['FinanceOfficer'] },
    viewer: { userId: 'viewer', fullName: 'Read Only User', email: 'viewer@p2p.example', companyCode: '1000', costCenter: 'CC900', language: 'EN', status: 'Active', roles: ['Viewer'] }
  };

  return {
    createDeviceModel: function () {
      return new JSONModel(Device);
    },

    createSession: function () {
      return {
        currentUser: users.viewer,
        canMock: new URLSearchParams(window.location.search).get('mock') === 'true',
        login: {
          userId: 'viewer',
          password: ''
        }
      };
    },

    getUserDefinition: function (userId) {
      return users[userId] || users.viewer;
    },

    isRouteAllowed: function (routeName, roles) {
      if (!routeName || routeName === 'login' || routeName === 'accessDenied') {
        return true;
      }
      if (!roles || !roles.length) {
        return false;
      }
      return roles.some((role) => roleRoutes[role] && roleRoutes[role].indexOf(routeName) !== -1);
    }
  };
});
