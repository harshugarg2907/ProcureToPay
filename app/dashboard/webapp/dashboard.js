(function () {
  "use strict";

  var message = document.getElementById("message");

  if (!window.P2PAuth.requireAuth("/dashboard/index.html")) {
    return;
  }

  window.P2PAuth.renderHeader("P2P Dashboard");

  function amount(value) {
    return Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  async function read(path) {
    var response = await fetch("/odata/v4/p2p/" + path);
    if (!response.ok) throw new Error("Unable to load dashboard data.");
    return response.json();
  }

  function render(id, rows, cells) {
    document.getElementById(id).innerHTML = rows.map(function (row) {
      return "<tr>" + cells.map(function (cell) { return "<td>" + cell(row) + "</td>"; }).join("") + "</tr>";
    }).join("");
  }

  Promise.all([read("POStatusAnalytics"), read("VendorSpendAnalytics")]).then(function (results) {
    render("poStatusBody", results[0].value, [
      function (row) { return row.status || ""; },
      function (row) { return row.total || 0; }
    ]);
    render("vendorSpendBody", results[1].value, [
      function (row) { return row.vendorName || ""; },
      function (row) { return amount(row.totalSpend); }
    ]);
  }).catch(function (error) {
    message.textContent = error.message;
  });
}());
