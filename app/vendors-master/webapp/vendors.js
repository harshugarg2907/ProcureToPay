(function () {
  "use strict";

  var auth = JSON.parse(sessionStorage.getItem("p2p.auth") || "{}");
  var message = document.getElementById("message");

  if (!auth.authorization) {
    window.location.href = "/login-page/index.html";
    return;
  }

  function amount(value) {
    return Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  async function read(path) {
    var response = await fetch("/odata/v4/p2p/" + path, { headers: { Authorization: auth.authorization } });
    if (!response.ok) throw new Error("Unable to load vendor master data.");
    return response.json();
  }

  function render(id, rows, cells) {
    document.getElementById(id).innerHTML = rows.map(function (row) {
      return "<tr>" + cells.map(function (cell) { return "<td>" + cell(row) + "</td>"; }).join("") + "</tr>";
    }).join("");
  }

  Promise.all([
    read("Vendors?$select=vendorNo,name,city,status"),
    read("Materials?$select=materialNo,description,plant,movingAvgPrice"),
    read("PurchaseOrders?$select=poNo,totalNetValue,status&$expand=vendor($select=name)")
  ]).then(function (results) {
    render("vendorsBody", results[0].value, [
      function (row) { return row.vendorNo || ""; },
      function (row) { return row.name || ""; },
      function (row) { return row.city || ""; },
      function (row) { return row.status || ""; }
    ]);
    render("materialsBody", results[1].value, [
      function (row) { return row.materialNo || ""; },
      function (row) { return row.description || ""; },
      function (row) { return row.plant || ""; },
      function (row) { return amount(row.movingAvgPrice); }
    ]);
    render("ordersBody", results[2].value, [
      function (row) { return row.poNo || ""; },
      function (row) { return row.vendor ? row.vendor.name : ""; },
      function (row) { return amount(row.totalNetValue); },
      function (row) { return row.status || ""; }
    ]);
  }).catch(function (error) {
    message.textContent = error.message;
  });
}());
