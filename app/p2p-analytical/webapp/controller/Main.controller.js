sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "p2p/common/Auth",
  "p2p/common/Header"
], function (Controller, JSONModel, MessageBox, Auth, Header) {
  "use strict";

  var KPI_CONFIG = [
    ["Total Vendors", "Vendors", "/p2p-list-object/index.html?entity=Vendors", "sap-icon://supplier"],
    ["Total Materials", "Materials", "/p2p-list-object/index.html?entity=Materials", "sap-icon://product"],
    ["Total Purchase Requisitions", "PurchaseRequisitions", "/p2p-list-object/index.html?entity=PurchaseRequisitions", "sap-icon://request"],
    ["Total RFQs", "RFQs", "/p2p-list-object/index.html?entity=RFQs", "sap-icon://sales-quote"],
    ["Total Purchase Orders", "PurchaseOrders", "/p2p-list-object/index.html?entity=PurchaseOrders", "sap-icon://cart-3"],
    ["Total Inspection Lots", "InspectionLots", "/p2p-list-object/index.html?entity=InspectionLots", "sap-icon://inspection"],
    ["Total Goods Receipts", "GoodsReceipts", "/p2p-list-object/index.html?entity=GoodsReceipts", "sap-icon://shipping-status"],
    ["Total Invoices", "Invoices", "/p2p-list-object/index.html?entity=Invoices", "sap-icon://receipt"],
    ["Total Payment Runs", "PaymentRuns", "/p2p-list-object/index.html?entity=PaymentRuns", "sap-icon://payment-approval"]
  ];

  return Controller.extend("sap.cap.p2p.analytical.controller.Main", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth("/p2p-analytical/index.html")) {
        return;
      }

      this.getView().setModel(new JSONModel({
        kpis: [],
        poStatus: [],
        vendorSpend: [],
        insights: [],
        totalSpendText: "0"
      }), "analytics");
      Header.apply(this, "Total Spend Analytics");
      this._loadAnalytics();
    },

    onKpiPress: function (event) {
      var path = event.getSource().getBindingContext("analytics").getProperty("path");
      window.location.href = path;
    },

    onVendorSpendPress: function (event) {
      var vendor = event.getSource().getBindingContext("analytics").getProperty("vendorName");
      this._navigateToVendor(vendor);
    },

    onPOStatusPress: function (event) {
      var status = event.getSource().getBindingContext("analytics").getProperty("status");
      this._navigateToStatus(status);
    },

    onVendorChartSelect: function (event) {
      var data = event.getParameter("data") || [];
      var vendor = data[0] && data[0].data && data[0].data.Vendor;
      this._navigateToVendor(vendor);
    },

    onStatusChartSelect: function (event) {
      var data = event.getParameter("data") || [];
      var status = data[0] && data[0].data && data[0].data.Status;
      this._navigateToStatus(status);
    },

    _loadAnalytics: async function () {
      try {
        var poStatus = await this._read("POStatusAnalytics");
        var vendorSpend = await this._read("VendorSpendAnalytics");
        var vendors = await this._read("Vendors");
        var totalSpend = this._sum(vendorSpend, "totalSpend");
        var activeVendorCount = vendors.filter(function (vendor) {
          return String(vendor.status || "").toLowerCase() === "active";
        }).length;
        var kpis = [];

        for (var i = 0; i < KPI_CONFIG.length; i += 1) {
          var config = KPI_CONFIG[i];
          kpis.push({
            title: config[0],
            subtitle: config[1],
            value: String(await this._count(config[1])),
            path: config[2],
            icon: config[3]
          });
        }

        kpis.push({
          title: "Total Procurement Spend",
          subtitle: "All vendor PO spend",
          value: this._formatNumber(totalSpend),
          path: "/p2p-list-object/index.html?entity=PurchaseOrders",
          icon: "sap-icon://money-bills"
        });

        this.getView().getModel("analytics").setData({
          kpis: kpis,
          poStatus: poStatus,
          vendorSpend: vendorSpend,
          insights: this._buildInsights(vendorSpend, poStatus, totalSpend, activeVendorCount),
          totalSpendText: this._formatNumber(totalSpend)
        });

        this._applyChartOptions();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load analytics.");
      }
    },

    _read: async function (entity) {
      var response = await fetch("/odata/v4/p2p/" + entity);

      if (!response.ok) {
        throw new Error("Unable to load " + entity + ".");
      }

      return (await response.json()).value || [];
    },

    _count: async function (entity) {
      try {
        var response = await fetch("/odata/v4/p2p/" + entity + "/$count");

        if (response.ok) {
          return Number(await response.text()) || 0;
        }
      } catch (error) {
        return 0;
      }

      return (await this._read(entity)).length;
    },

    _sum: function (rows, property) {
      return rows.reduce(function (sum, row) {
        return sum + Number(row[property] || 0);
      }, 0);
    },

    _buildInsights: function (vendorSpend, poStatus, totalSpend, activeVendorCount) {
      var topVendor = vendorSpend.reduce(function (best, row) {
        return Number(row.totalSpend || 0) > Number((best && best.totalSpend) || 0) ? row : best;
      }, null);
      var highestStatus = poStatus.reduce(function (best, row) {
        return Number(row.total || 0) > Number((best && best.total) || 0) ? row : best;
      }, null);

      return [
        {
          title: "Top Vendor by Spend",
          value: topVendor ? topVendor.vendorName : "-",
          subtitle: topVendor ? this._formatNumber(topVendor.totalSpend) + " INR" : "No spend data",
          icon: "sap-icon://supplier"
        },
        {
          title: "Highest PO Volume Status",
          value: highestStatus ? highestStatus.status : "-",
          subtitle: highestStatus ? highestStatus.total + " purchase orders" : "No PO status data",
          icon: "sap-icon://activity-individual"
        },
        {
          title: "Total Procurement Spend",
          value: this._formatNumber(totalSpend),
          subtitle: "Across all vendor spend",
          icon: "sap-icon://money-bills"
        },
        {
          title: "Total Active Vendors",
          value: String(activeVendorCount),
          subtitle: "Available vendor master records",
          icon: "sap-icon://company-view"
        }
      ];
    },

    _applyChartOptions: function () {
      var charts = [
        this.byId("vendorSpendBar"),
        this.byId("vendorSpendDonut"),
        this.byId("poStatusBar"),
        this.byId("poStatusDonut")
      ];

      charts.forEach(function (chart) {
        if (chart) {
          chart.setVizProperties({
            plotArea: {
              dataLabel: { visible: true },
              colorPalette: ["#0a6ed1", "#30914c", "#e9730c", "#925ace", "#00a3a3", "#d04343", "#647987"]
            },
            legend: { visible: true },
            title: { visible: false },
            valueAxis: { title: { visible: false } },
            categoryAxis: { title: { visible: false } }
          });
        }
      });
    },

    _navigateToVendor: function (vendor) {
      if (vendor) {
        window.location.href = "/p2p-list-object/index.html?entity=PurchaseOrders&vendor=" + encodeURIComponent(vendor);
      }
    },

    _navigateToStatus: function (status) {
      if (status) {
        window.location.href = "/p2p-list-object/index.html?entity=PurchaseOrders&status=" + encodeURIComponent(status);
      }
    },

    _formatNumber: function (value) {
      return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
  });
});
