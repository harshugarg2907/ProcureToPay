namespace sap.cap.p2p;

using { cuid, managed } from '@sap/cds/common';

entity Users : cuid, managed {
  userId      : String(50);
  fullName    : String(100);
  email       : String(100);
  companyCode : String(10);
  costCenter  : String(30);
  language    : String(5);
  status      : String(20);
  roles       : Composition of many UserRoles on roles.user = $self;
}

entity UserRoles : cuid, managed {
  user     : Association to Users;
  roleName : String(50);
  module   : String(30);
  status   : String(20);
}

entity Vendors : cuid, managed {
  vendorNo     : String(20);
  name         : String(100);
  accountGroup : String(20);
  purchOrg     : String(10);
  country      : String(5);
  city         : String(100);
  language     : String(5);
  telephone    : String(30);
  email        : String(100);
  paymentTerms : String(20);
  currency     : String(5);
  taxNo        : String(30);
  incoterms    : String(10);
  bankKey      : String(30);
  bankAccount  : String(50);
  status       : String(20);
}

entity Materials : cuid, managed {
  materialNo      : String(30);
  description     : String(200);
  materialType    : String(20);
  materialGroup   : String(30);
  baseUom         : String(10);
  grossWeight     : Decimal(15,3);
  netWeight       : Decimal(15,3);
  purchasingGroup : String(10);
  plant           : String(10);
  valuationClass  : String(20);
  movingAvgPrice  : Decimal(15,2);
  minOrderQty     : Decimal(15,3);
  orderUnit       : String(10);
  status          : String(20);
}

entity PurchaseRequisitions : cuid, managed {
  prNo          : String(30);
  requisitioner : String(50);
  purchasingOrg : String(10);
  documentType  : String(10);
  requestDate   : Date;
  status        : String(30);
  totalItems    : Integer;
  assignedRole  : String(50);
  items         : Composition of many PurchaseRequisitionItems on items.requisition = $self;
}

entity PurchaseRequisitionItems : cuid, managed {
  requisition  : Association to PurchaseRequisitions;
  itemNo       : Integer;
  material     : Association to Materials;
  shortText    : String(200);
  quantity     : Decimal(15,3);
  uom          : String(10);
  deliveryDate : Date;
  plant        : String(10);
  accountAssignment : String(30);
}

entity RFQs : cuid, managed {
  rfqNo           : String(30);
  sourcePR        : Association to PurchaseRequisitions;
  rfqType         : String(10);
  purchasingOrg   : String(10);
  purchasingGroup : String(10);
  submissionDeadline : Date;
  status          : String(30);
  selectedVendor  : Association to Vendors;
  assignedRole    : String(50);
  vendors         : Composition of many RFQVendors on vendors.rfq = $self;
  items           : Composition of many RFQItems on items.rfq = $self;
}

entity RFQVendors : cuid, managed {
  rfq       : Association to RFQs;
  vendor    : Association to Vendors;
  email     : String(100);
  sentStatus : String(20);
  responseStatus : String(30);
  quotedAmount : Decimal(15,2);
  leadTime     : Integer;
  remarks      : String(200);
}

entity RFQItems : cuid, managed {
  rfq         : Association to RFQs;
  material    : Association to Materials;
  description : String(200);
  quantity    : Decimal(15,3);
  uom         : String(10);
}

entity PurchaseOrders : cuid, managed {
  poNo            : String(30);
  sourceRFQ       : Association to RFQs;
  sourcePR        : Association to PurchaseRequisitions;
  vendor          : Association to Vendors;
  purchasingOrg   : String(10);
  purchasingGroup : String(10);
  companyCode     : String(10);
  currency        : String(5);
  documentDate    : Date;
  deliveryDate    : Date;
  status          : String(30);
  totalNetValue   : Decimal(15,2);
  assignedRole    : String(50);
  items           : Composition of many PurchaseOrderItems on items.purchaseOrder = $self;
}

entity PurchaseOrderItems : cuid, managed {
  purchaseOrder   : Association to PurchaseOrders;
  material        : Association to Materials;
  quantity        : Decimal(15,3);
  unitPrice       : Decimal(15,2);
  netValue        : Decimal(15,2);
  deliveryDate    : Date;
  plant           : String(10);
  storageLocation : String(10);
  uom             : String(10);
}

entity InspectionLots : cuid, managed {
  inspectionLotNo : String(30);
  inspectionType  : String(10);
  purchaseOrder   : Association to PurchaseOrders;
  material        : Association to Materials;
  vendor          : Association to Vendors;
  lotQuantity     : Decimal(15,3);
  acceptedQuantity : Decimal(15,3);
  rejectedQuantity : Decimal(15,3);
  usageDecisionCode : String(20);
  rejectionReason : String(200);
  status          : String(30);
  assignedRole    : String(50);
  characteristics : Composition of many InspectionCharacteristics on characteristics.inspectionLot = $self;
}

entity InspectionCharacteristics : cuid, managed {
  inspectionLot : Association to InspectionLots;
  characteristicId : String(30);
  characteristicName : String(100);
  specification : String(100);
  actualValue : String(100);
  result : String(20);
}

entity GoodsReceipts : cuid, managed {
  grNo            : String(30);
  purchaseOrder   : Association to PurchaseOrders;
  inspectionLot   : Association to InspectionLots;
  postingDate     : Date;
  documentDate    : Date;
  plant           : String(10);
  storageLocation : String(10);
  batch           : String(30);
  totalGRValue    : Decimal(15,2);
  status          : String(30);
  assignedRole    : String(50);
  items           : Composition of many GoodsReceiptItems on items.goodsReceipt = $self;
}

entity GoodsReceiptItems : cuid, managed {
  goodsReceipt    : Association to GoodsReceipts;
  material        : Association to Materials;
  quantity        : Decimal(15,3);
  uom             : String(10);
  stockType       : String(30);
  movementType    : String(3);
  storageLocation : String(10);
}

entity Invoices : cuid, managed {
  invoiceNo       : String(30);
  vendor          : Association to Vendors;
  purchaseOrder   : Association to PurchaseOrders;
  goodsReceipt    : Association to GoodsReceipts;
  invoiceDate     : Date;
  postingDate     : Date;
  invoiceReference : String(50);
  currency        : String(5);
  paymentTerms    : String(20);
  netAmount       : Decimal(15,2);
  taxAmount       : Decimal(15,2);
  totalPayable    : Decimal(15,2);
  dueDate         : Date;
  matchStatus     : String(30);
  status          : String(30);
  assignedRole    : String(50);
}

entity PaymentRuns : cuid, managed {
  paymentRunId    : String(30);
  runDate         : Date;
  companyCode     : String(10);
  paymentMethod   : String(10);
  nextPaymentDate : Date;
  status          : String(30);
  totalPaymentAmount : Decimal(15,2);
  assignedRole    : String(50);
  items           : Composition of many PaymentRunItems on items.paymentRun = $self;
}

entity PaymentRunItems : cuid, managed {
  paymentRun      : Association to PaymentRuns;
  vendor          : Association to Vendors;
  invoice         : Association to Invoices;
  documentNumber  : String(30);
  dueDate         : Date;
  grossAmount     : Decimal(15,2);
  discount        : Decimal(15,2);
  netPayment      : Decimal(15,2);
  selected        : Boolean;
}
