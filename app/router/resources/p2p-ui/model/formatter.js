sap.ui.define([
  "sap/ui/core/format/DateFormat",
  "sap/ui/core/format/NumberFormat"
], function (DateFormat, NumberFormat) {
  "use strict";

  const oDateFormat = DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
  const oCurrencyFormat = NumberFormat.getCurrencyInstance();

  return {
    formatDate: function (value) {
      return value ? oDateFormat.format(new Date(value)) : "";
    },

    formatCurrency: function (value) {
      return value !== undefined && value !== null ? oCurrencyFormat.format(value, "USD") : "";
    },

    statusText: function (status) {
      return status || "Unknown";
    }
  };
});
