(function () {
  "use strict";

  var auth = JSON.parse(sessionStorage.getItem("p2p.auth") || "{}");
  var message = document.getElementById("message");

  if (!auth.authorization) {
    window.location.href = "/login-page/index.html";
    return;
  }

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab,.panel").forEach(function (item) { item.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });

  function amount(value) {
    return Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  async function read(path) {
    var response = await fetch("/odata/v4/p2p/" + path, { headers: { Authorization: auth.authorization } });
    if (!response.ok) throw new Error("Unable to load procurement data.");
    return response.json();
  }

  function render(id, rows, cells) {
    document.getElementById(id).innerHTML = rows.map(function (row) {
      return "<tr>" + cells.map(function (cell) { return "<td>" + cell(row) + "</td>"; }).join("") + "</tr>";
    }).join("");
  }

  Promise.all([
    read("PurchaseRequisitions?$select=prNo,requisitioner,purchasingOrg,status"),
    read("RFQs?$select=rfqNo,purchasingOrg,submissionDeadline,status"),
    read("PurchaseOrders?$select=poNo,totalNetValue,status&$expand=vendor($select=name)")
  ]).then(function (results) {
    render("prsBody", results[0].value, [
      function (row) { return row.prNo || ""; },
      function (row) { return row.requisitioner || ""; },
      function (row) { return row.purchasingOrg || ""; },
      function (row) { return row.status || ""; }
    ]);
    render("rfqsBody", results[1].value, [
      function (row) { return row.rfqNo || ""; },
      function (row) { return row.purchasingOrg || ""; },
      function (row) { return row.submissionDeadline || ""; },
      function (row) { return row.status || ""; }
    ]);
    render("posBody", results[2].value, [
      function (row) { return row.poNo || ""; },
      function (row) { return row.vendor ? row.vendor.name : ""; },
      function (row) { return amount(row.totalNetValue); },
      function (row) { return row.status || ""; }
    ]);
  }).catch(function (error) {
    message.textContent = error.message;
  });
}());
