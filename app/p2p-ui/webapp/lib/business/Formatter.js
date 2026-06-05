sap.ui.define([
  "sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
  "use strict";

  const oCurrencyFormat = NumberFormat.getCurrencyInstance();

  return {
    formatDate: function (value) {
      if (!value) {
        return "";
      }
      return new Date(value).toISOString().slice(0, 10);
    },

    formatCurrency: function (value) {
      if (value === undefined || value === null) {
        return "";
      }
      return oCurrencyFormat.format(value, "USD");
    },

    formatStatusState: function (status) {
      switch (status) {
        case 'Approved':
        case 'Posted':
        case 'Paid':
          return 'Success';
        case 'Submitted':
        case 'Open':
        case 'Pending':
          return 'Warning';
        case 'Rejected':
        case 'Blocked':
        case 'Mismatch':
          return 'Error';
        default:
          return 'None';
      }
    }
  };
});
