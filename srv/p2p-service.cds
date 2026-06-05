using sap.cap.p2p as db from '../db/schema';

service P2PService @(path: '/odata/v4/p2p') {
  @readonly
  entity CurrentUser as projection on db.Users;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'QCInspector', 'GoodsReceiptOfficer', 'FinanceOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity Users as projection on db.Users;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'QCInspector', 'GoodsReceiptOfficer', 'FinanceOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['Admin'] }
  ]
  entity UserRoles as projection on db.UserRoles;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'FinanceOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['Admin'] }
  ]
  entity Vendors as projection on db.Vendors;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['Admin'] }
  ]
  entity Materials as projection on db.Materials;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'ProcurementOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity PurchaseRequisitions as projection on db.PurchaseRequisitions;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'ProcurementOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity PurchaseRequisitionItems as projection on db.PurchaseRequisitionItems;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'ProcurementOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity RFQs as projection on db.RFQs;

  entity RFQVendors as projection on db.RFQVendors;
  entity RFQItems as projection on db.RFQItems;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'ProcurementOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity PurchaseOrders as projection on db.PurchaseOrders;

  entity PurchaseOrderItems as projection on db.PurchaseOrderItems;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'QCInspector', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'QCInspector'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity InspectionLots as projection on db.InspectionLots;

  entity InspectionCharacteristics as projection on db.InspectionCharacteristics;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'GoodsReceiptOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'GoodsReceiptOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity GoodsReceipts as projection on db.GoodsReceipts;

  entity GoodsReceiptItems as projection on db.GoodsReceiptItems;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'FinanceOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'FinanceOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity Invoices as projection on db.Invoices;

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'FinanceOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'FinanceOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity PaymentRuns as projection on db.PaymentRuns;

  @cds.redirection.target
  entity PaymentRunItems as projection on db.PaymentRunItems;

  action getCurrentUser(userId: String) returns CurrentUser;
  action submitPurchaseRequisition(prId: UUID) returns String;
  action approvePurchaseRequisition(prId: UUID) returns String;
  action createRFQFromPR(prId: UUID) returns String;
  action issueRFQ(rfqId: UUID) returns String;
  action createPOFromRFQ(rfqId: UUID, vendorId: UUID) returns String;
  action approvePO(poId: UUID) returns String;
  action postUsageDecision(lotId: UUID) returns String;
  action postGoodsReceipt(lotId: UUID) returns String;
  action runThreeWayMatch(invoiceId: UUID) returns String;
  action createPaymentAdvice(invoiceId: UUID) returns String;
  action executePaymentRun(paymentRunId: UUID) returns String;

  @readonly
  entity POStatusAnalytics as select from db.PurchaseOrders { key status, count(*) as total: Integer } group by status;
  @readonly
  entity VendorSpendAnalytics as select from db.PurchaseOrders { key vendor.name as vendorName, sum(totalNetValue) as totalSpend: Decimal(15,2) } group by vendor.name;
  @readonly
  entity QCResultAnalytics as select from db.InspectionLots { key status, sum(acceptedQuantity) as acceptedQuantity: Decimal(15,3), sum(rejectedQuantity) as rejectedQuantity: Decimal(15,3) } group by status;
  @readonly
  entity InvoiceMatchAnalytics as select from db.Invoices { key matchStatus, count(*) as total: Integer } group by matchStatus;
  @readonly
  entity PaymentDueAnalytics as select from db.PaymentRunItems { key vendor.name as vendorName, sum(netPayment) as amountDue: Decimal(15,2) } where selected = true group by vendor.name;
  @readonly
  entity MonthlyProcurementAnalytics as select from db.PurchaseOrders { key documentDate, sum(totalNetValue) as totalValue: Decimal(15,2) } group by documentDate;
}
