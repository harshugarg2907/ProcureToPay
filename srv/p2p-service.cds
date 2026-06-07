using sap.cap.p2p as db from '../db/schema';

service P2PService @(path: '/odata/v4/p2p') {
  @readonly
  entity CurrentUser as projection on db.Users {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    userId,
    fullName,
    email,
    companyCode,
    costCenter,
    language,
    status
  };

  @restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity Users as projection on db.Users {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    userId,
    fullName,
    email,
    companyCode,
    costCenter,
    language,
    status
  };

  @restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: ['Admin'] }
  ]
  entity UserRoles as projection on db.UserRoles {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    user,
    roleName,
    module,
    status
  };

  type UserRoleContext {
    roleName : String(50);
    module   : String(30);
    status   : String(20);
  }

  type CurrentUserContext {
    ID          : UUID;
    userId      : String(50);
    fullName    : String(100);
    email       : String(100);
    companyCode : String(10);
    costCenter  : String(30);
    language    : String(5);
    status      : String(20);
    roles       : many UserRoleContext;
  }

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
  entity PurchaseRequisitions as projection on db.PurchaseRequisitions {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    prNo,
    requisitioner,
    purchasingOrg,
    documentType,
    requestDate,
    status,
    totalItems
  };

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'ProcurementOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity RFQs as projection on db.RFQs {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    rfqNo,
    sourcePR,
    rfqType,
    purchasingOrg,
    purchasingGroup,
    submissionDeadline,
    status,
    selectedVendor
  };

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'ProcurementOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'ProcurementOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity PurchaseOrders as projection on db.PurchaseOrders {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    poNo,
    sourceRFQ,
    vendor,
    purchasingOrg,
    purchasingGroup,
    companyCode,
    currency,
    documentDate,
    deliveryDate,
    status,
    totalNetValue
  };

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'QCInspector', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'QCInspector'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  @cds.redirection.target
  entity InspectionLots as projection on db.InspectionLots {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    inspectionLotNo,
    inspectionType,
    purchaseOrder,
    material,
    vendor,
    lotQuantity,
    acceptedQuantity,
    rejectedQuantity,
    usageDecisionCode,
    rejectionReason,
    status
  };

  @restrict: [
    { grant: ['READ'], to: ['Admin', 'GoodsReceiptOfficer', 'Viewer'] },
    { grant: ['CREATE', 'UPDATE'], to: ['Admin', 'GoodsReceiptOfficer'] },
    { grant: ['DELETE'], to: ['Admin'] }
  ]
  entity GoodsReceipts as projection on db.GoodsReceipts {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    grNo,
    purchaseOrder,
    inspectionLot,
    postingDate,
    documentDate,
    plant,
    storageLocation,
    batch,
    totalGRValue,
    status
  };

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
  entity PaymentRuns as projection on db.PaymentRuns {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    paymentRunId,
    runDate,
    companyCode,
    paymentMethod,
    nextPaymentDate,
    status,
    totalPaymentAmount
  };

  action getCurrentUser(userId: String) returns CurrentUserContext;
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
}
