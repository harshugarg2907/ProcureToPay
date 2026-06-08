sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (JSONModel, Device) {
  "use strict";

  const roleRoutes = {
    P2P_ADMIN: ['launchpad','profile','purchaseRequisition','rfq','vendors','materials','purchaseOrders','qualityInspection','goodsReceipt','invoice','paymentRun','analytics'],
    P2P_BUYER: ['launchpad','profile','purchaseRequisition','rfq','vendors','materials','purchaseOrders','goodsReceipt','analytics'],
    P2P_REQUESTER: ['launchpad','profile','purchaseRequisition'],
    P2P_VENDOR_MANAGER: ['launchpad','profile','vendors','materials'],
    P2P_QUALITY_INSPECTOR: ['launchpad','profile','qualityInspection','analytics'],
    P2P_AP_CLERK: ['launchpad','profile','invoice','paymentRun'],
    P2P_FINANCE_MANAGER: ['launchpad','profile','invoice','paymentRun','analytics']
  };

  const users = {
    admin: { userId: 'admin', fullName: 'System Administrator', email: 'admin@p2p.example', companyCode: '1000', costCenter: 'CC100', language: 'EN', status: 'Active', roles: ['P2P_ADMIN'] },
    jsmith: { userId: 'jsmith', fullName: 'John Smith', email: 'jsmith@p2p.example', companyCode: '1000', costCenter: 'CC200', language: 'EN', status: 'Active', roles: ['P2P_BUYER'] },
    requester: { userId: 'requester', fullName: 'Purchase Requester', email: 'requester@p2p.example', companyCode: '1000', costCenter: 'CC250', language: 'EN', status: 'Active', roles: ['P2P_REQUESTER'] },
    vendormgr: { userId: 'vendormgr', fullName: 'Vendor Manager', email: 'vendormgr@p2p.example', companyCode: '1000', costCenter: 'CC260', language: 'EN', status: 'Active', roles: ['P2P_VENDOR_MANAGER'] },
    qinspector: { userId: 'qinspector', fullName: 'Quality Inspector', email: 'qinspector@p2p.example', companyCode: '1000', costCenter: 'CC300', language: 'EN', status: 'Active', roles: ['P2P_QUALITY_INSPECTOR'] },
    apclerk: { userId: 'apclerk', fullName: 'AP Clerk', email: 'apclerk@p2p.example', companyCode: '1000', costCenter: 'CC450', language: 'EN', status: 'Active', roles: ['P2P_AP_CLERK'] },
    finance: { userId: 'finance', fullName: 'Finance Manager', email: 'finance@p2p.example', companyCode: '1000', costCenter: 'CC500', language: 'EN', status: 'Active', roles: ['P2P_FINANCE_MANAGER'] }
  };

  return {
    createDeviceModel: function () {
      return new JSONModel(Device);
    },

    createSession: function () {
      return {
        currentUser: users.admin,
        canMock: new URLSearchParams(window.location.search).get('mock') === 'true'
      };
    },

    getUserDefinition: function (userId) {
      return users[userId] || users.admin;
    },

    isRouteAllowed: function (routeName, roles) {
      if (!routeName || routeName === 'accessDenied') {
        return true;
      }
      if (!roles || !roles.length) {
        return false;
      }
      return roles.some((role) => roleRoutes[role] && roleRoutes[role].indexOf(routeName) !== -1);
    }
  };
});
