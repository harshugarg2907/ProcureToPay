(function () {
  "use strict";

  var message = document.getElementById("message");

  if (!window.P2PAuth.requireAuth("/procurement-pages/index.html")) {
    return;
  }

  window.P2PAuth.renderHeader("Procurement Pages");

  var entity = new URLSearchParams(window.location.search).get("entity") || "PurchaseRequisitions";
  var targetByEntity = {
    PurchaseRequisitions: "prs",
    RFQs: "rfqs",
    PurchaseOrders: "pos"
  };
  var activeTarget = targetByEntity[entity] || "prs";

  document.querySelectorAll(".tab,.panel").forEach(function (item) {
    var target = item.dataset ? item.dataset.target : item.id;
    var isActive = target === activeTarget || item.id === activeTarget;

    if (target && target !== activeTarget && item.id !== activeTarget) {
      item.hidden = true;
    }

    item.classList.toggle("active", isActive);
  });

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
    var response = await fetch("/odata/v4/p2p/" + path);
    if (!response.ok) throw new Error("Unable to load procurement data.");
    return response.json();
  }

  function render(id, rows, cells) {
    document.getElementById(id).innerHTML = rows.map(function (row) {
      return "<tr>" + cells.map(function (cell) { return "<td>" + cell(row) + "</td>"; }).join("") + "</tr>";
    }).join("");
  }

  if (activeTarget === "prs") {
    read("PurchaseRequisitions?$select=prNo,requisitioner,purchasingOrg,status").then(function (result) {
      render("prsBody", result.value, [
      function (row) { return row.prNo || ""; },
      function (row) { return row.requisitioner || ""; },
      function (row) { return row.purchasingOrg || ""; },
      function (row) { return row.status || ""; }
      ]);
    }).catch(function (error) {
      message.textContent = error.message;
    });
  } else if (activeTarget === "rfqs") {
    read("RFQs?$select=rfqNo,purchasingOrg,submissionDeadline,status").then(function (result) {
      render("rfqsBody", result.value, [
      function (row) { return row.rfqNo || ""; },
      function (row) { return row.purchasingOrg || ""; },
      function (row) { return row.submissionDeadline || ""; },
      function (row) { return row.status || ""; }
      ]);
    }).catch(function (error) {
      message.textContent = error.message;
    });
  } else {
    read("PurchaseOrders?$select=poNo,totalNetValue,status&$expand=vendor($select=name)").then(function (result) {
      render("posBody", result.value, [
      function (row) { return row.poNo || ""; },
      function (row) { return row.vendor ? row.vendor.name : ""; },
      function (row) { return amount(row.totalNetValue); },
      function (row) { return row.status || ""; }
      ]);
    }).catch(function (error) {
      message.textContent = error.message;
    });
  }
}());
