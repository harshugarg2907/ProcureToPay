# SAP CAP Full Stack Project Implementation Guide

## Project Title
**SAP CAP Full Stack Procure-to-Pay Application**

## Purpose
Build a full stack SAP CAP + SAPUI5/Fiori application inspired by a Procure-to-Pay process. The reference flow is based on an SAP S/4HANA style process covering Login, Fiori Launchpad, User Profile, Purchase Requisition, RFQ, Vendor Master, Material Master, Purchase Order, Quality Inspection, Goods Receipt, Invoice Verification, and Automatic Payment Processing.

This guide is written as a **Codex-ready implementation prompt/specification**. Use it to generate the complete project step by step.

---

# 1. Target Tech Stack

## Backend
- SAP CAP Node.js
- CDS data model
- OData V4 service
- SQLite for local development
- SAP HANA compatible model structure
- XSUAA authentication and role-based authorization
- Annotations for Fiori Elements and UI metadata
- Mock data using CSV files

## Frontend
- SAPUI5 / OpenUI5 freestyle application
- XML views
- XML fragments
- Custom control
- XML composite control
- Reusable UI5 library module
- Mock server for frontend-only testing
- Charts and analytics visualization
- Fiori-like Launchpad dashboard

## Security
- XSUAA based login simulation for deployed mode
- Role-based access using CAP `@requires` and `@restrict`
- Frontend route guards based on user role

---

# 2. Business Scenario

The application represents an end-to-end **Procure-to-Pay** process.

Users log in and access apps based on their assigned roles. A procurement user can create purchase requisitions, issue RFQs, view vendors and materials, manage purchase orders, process quality inspection, post goods receipt, verify invoices, and execute payment runs.

The process is inspired by classic SAP transaction codes:

| Step | Process | SAP Transaction Reference | Module |
|---|---|---|---|
| 1 | Login | SAP Login | Security |
| 2 | Launchpad | Fiori Launchpad | UX |
| 3 | User Profile | SU01 | Security |
| 4 | P2P Navigation | App Group | UX |
| 5 | Purchase Requisition | ME51N | MM |
| 6 | Request for Quotation | ME41 | MM |
| 7 | Vendor Master | MK03 | MM |
| 8 | Material Master | MM03 | MM |
| 9 | Purchase Order | ME2M / ME21N | MM |
| 10 | Quality Inspection | QA32 | QM |
| 11 | Goods Receipt | MIGO | WM/MM |
| 12 | Invoice Verification | MIRO | FI |
| 13 | Payment Run | F110 | FI |

---

# 3. User Roles

Create the following business roles in XSUAA and CAP:

## 3.1 Admin
Can access all modules and maintain master data.

Permissions:
- Manage users
- Manage vendors
- Manage materials
- View all analytics
- Approve or reject documents

## 3.2 Procurement Officer
Equivalent to the sample user `JSMITH` from the reference presentation.

Permissions:
- Create purchase requisitions
- Create RFQs
- View vendor master
- View material master
- Create and manage purchase orders

## 3.3 QC Inspector
Permissions:
- View purchase orders requiring inspection
- Create inspection lots
- Enter inspection characteristics
- Post usage decision
- Mark accepted/rejected quantity

## 3.4 Goods Receipt Officer
Permissions:
- View approved purchase orders
- Post goods receipt
- Transfer accepted stock to unrestricted inventory
- Mark rejected quantity for return to vendor

## 3.5 Finance Officer
Permissions:
- Verify invoices
- Perform 3-way match
- Create payment advice
- Execute automatic payment run

## 3.6 Viewer
Permissions:
- Read-only access to dashboards and process status

---

# 4. Full User Flow

## Flow 1: Login and Role Authentication

1. User opens the SAP CAP full stack app.
2. If deployed with XSUAA, user is redirected to authentication.
3. After login, app reads authenticated user details.
4. Backend returns assigned roles.
5. Frontend shows tiles only for allowed modules.
6. Unauthorized routes show an access denied page.

Expected screen:
- Login screen inspired by SAP S/4HANA login
- User ID
- Password
- Language
- Log On button

For local development, simulate users:

| User | Role |
|---|---|
| admin | Admin |
| jsmith | Procurement Officer |
| qinspector | QC Inspector |
| grofficer | Goods Receipt Officer |
| finance | Finance Officer |
| viewer | Viewer |

---

## Flow 2: Fiori Launchpad Dashboard

After login, user lands on a Fiori-style launchpad.

Dashboard must show:
- Greeting message
- User initials/avatar
- Company code
- Cost center
- Assigned roles
- Module tiles
- Recent activity table
- Process progress chart

Tiles:
- Create Purchase Requisition
- Create RFQ
- Vendor Master
- Material Master
- Purchase Orders
- Quality Inspection
- Goods Receipt
- Invoice Verification
- Payment Run
- Analytics Overview

---

## Flow 3: User Profile and Authorization

User can open My Profile.

Profile must show:
- User ID
- Full name
- Email
- Company code
- Cost center
- Default language
- Assigned roles
- Role status

Backend entity:
- `Users`
- `UserRoles`

Frontend features:
- Display mode
- Admin can update role assignments
- Normal users can only view profile

---

## Flow 4: Purchase Requisition

User creates a purchase requisition.

Header fields:
- Requisition number
- Requisitioner
- Purchasing organization
- Document type
- Request date
- Status

Line item fields:
- Item number
- Material
- Short text
- Quantity
- Unit of measure
- Delivery date
- Plant
- Account assignment

Actions:
- Add row
- Save draft
- Submit PR
- Approve PR
- Reject PR

Validation:
- Quantity must be greater than zero
- Delivery date cannot be in the past
- Material is mandatory
- Plant is mandatory

Statuses:
- Draft
- Submitted
- Approved
- Rejected

---

## Flow 5: Request for Quotation

User creates RFQ from approved purchase requisition.

Header fields:
- RFQ number
- RFQ type
- Purchasing organization
- Purchasing group
- Submission deadline
- Status

Vendor section:
- Vendor number
- Vendor name
- Email
- RFQ sent status

Item section:
- Material
- Description
- Quantity
- Unit of measure

Actions:
- Create RFQ from PR
- Add vendors
- Issue RFQ
- Mark vendor response received
- Compare quotations
- Select vendor

Statuses:
- Draft
- Issued
- Responses Received
- Vendor Selected
- Closed

---

## Flow 6: Vendor Master

Vendor master is mostly display-focused, with admin maintenance.

Fields:
- Vendor ID
- Vendor name
- Account group
- Purchasing organization
- Country
- City
- Language
- Telephone
- Email
- Payment terms
- Currency
- Tax number
- Incoterms
- Bank key
- Bank account
- Status

Actions:
- Create vendor
- Edit vendor
- Display vendor
- Block vendor
- Unblock vendor

Authorization:
- Admin can create/update/delete
- Procurement Officer can read
- Finance Officer can read payment details

---

## Flow 7: Material Master

Material master stores purchasable items.

Fields:
- Material number
- Description
- Material type
- Material group
- Base unit of measure
- Gross weight
- Net weight
- Purchasing group
- Plant
- Valuation class
- Moving average price
- Minimum order quantity
- Order unit
- Status

Actions:
- Create material
- Edit material
- View material
- Block material

Authorization:
- Admin can maintain
- Procurement Officer can view

---

## Flow 8: Purchase Order

Purchase order can be created after vendor selection.

Header fields:
- PO number
- Vendor
- Purchasing organization
- Purchasing group
- Company code
- Currency
- Document date
- Status

Line item fields:
- Material
- Quantity
- Unit price
- Net value
- Delivery date
- Plant
- Storage location

Actions:
- Create PO from selected RFQ
- Save PO
- Approve PO
- Block PO
- Close PO

Statuses:
- Draft
- Open
- Approved
- Blocked
- Partially Received
- Received
- Invoiced
- Paid

---

## Flow 9: Quality Inspection

QC Inspector processes inspection lot for received material.

Inspection lot fields:
- Inspection lot number
- Inspection type
- Material
- Vendor
- PO number
- Lot quantity
- Accepted quantity
- Rejected quantity
- Usage decision code
- Rejection reason

Inspection characteristic fields:
- Characteristic ID
- Characteristic name
- Specification
- Actual value
- Result

Actions:
- Create inspection lot
- Add characteristic result
- Accept characteristic
- Reject characteristic
- Post usage decision

Validation:
- Accepted quantity + rejected quantity = lot quantity
- Usage decision required before posting

Statuses:
- Created
- In Inspection
- Accepted
- Partially Accepted
- Rejected

---

## Flow 10: Goods Receipt

Goods receipt is posted against purchase order after quality inspection.

Header fields:
- GR document number
- PO number
- Posting date
- Document date
- Plant
- Storage location
- Batch
- Total GR value

Line item fields:
- Material
- Quantity
- UoM
- Stock type
- Movement type
- Storage location

Movement types:
- `101` for unrestricted stock receipt
- `122` for return to vendor

Actions:
- Create GR from approved inspection lot
- Post GR
- Transfer accepted quantity to unrestricted stock
- Send rejected quantity to return vendor location

Statuses:
- Draft
- Posted
- Reversed

---

## Flow 11: Invoice Verification

Finance Officer performs invoice verification.

Invoice fields:
- Invoice number
- Vendor
- Invoice date
- Posting date
- Invoice reference
- Currency
- Payment terms
- Net amount
- Tax amount
- Total payable
- Due date

3-way match:
- Purchase order quantity/value
- Goods receipt quantity/value
- Vendor invoice quantity/value

Actions:
- Create invoice from GR
- Simulate invoice
- Run 3-way match
- Post invoice
- Raise payment advice

Statuses:
- Draft
- Matched
- Mismatch
- Posted
- Payment Advice Created

---

## Flow 12: Automatic Payment Run

Finance Officer executes payment processing.

Payment run fields:
- Payment run ID
- Run date
- Company code
- Payment method
- Next payment date
- Status
- Total payment amount

Payment item fields:
- Vendor
- Document number
- Due date
- Gross amount
- Discount
- Net payment
- Selected flag

Actions:
- Create payment run
- Generate proposal
- Approve proposal
- Execute payment
- Mark invoice as paid

Statuses:
- Parameters Set
- Proposal Created
- Proposal Approved
- Payment Posted
- Failed

---

# 5. Architecture

## 5.1 High-Level Architecture

```text
User Browser
   |
   v
SAPUI5 Freestyle App
   |
   | OData V4
   v
SAP CAP Service Layer
   |
   | CDS Model + Service Handlers
   v
Database Layer
   |
   v
SQLite Local / SAP HANA Cloud Production

Security:
User -> XSUAA -> CAP Authorization -> UI5 Role-Based Navigation
```

## 5.2 Application Layers

### UI Layer
Responsible for:
- Login screen
- Launchpad dashboard
- Navigation
- XML views
- Fragments
- Composite controls
- Custom controls
- Charts
- Mock server

### Service Layer
Responsible for:
- OData V4 exposure
- CRUD service
- Business actions
- Role restrictions
- Validation logic
- Process transitions

### Domain Layer
Responsible for:
- CDS entities
- Associations
- Compositions
- Value helps
- Annotations

### Persistence Layer
Responsible for:
- SQLite development DB
- CSV mock data
- HANA-compatible schema

---

# 6. Recommended Project Structure

```text
sap-cap-p2p/
│
├── app/
│   └── p2p-ui/
│       ├── webapp/
│       │   ├── controller/
│       │   │   ├── App.controller.js
│       │   │   ├── Launchpad.controller.js
│       │   │   ├── Profile.controller.js
│       │   │   ├── PurchaseRequisition.controller.js
│       │   │   ├── RFQ.controller.js
│       │   │   ├── Vendor.controller.js
│       │   │   ├── Material.controller.js
│       │   │   ├── PurchaseOrder.controller.js
│       │   │   ├── QualityInspection.controller.js
│       │   │   ├── GoodsReceipt.controller.js
│       │   │   ├── Invoice.controller.js
│       │   │   ├── PaymentRun.controller.js
│       │   │   └── Analytics.controller.js
│       │   │
│       │   ├── view/
│       │   │   ├── App.view.xml
│       │   │   ├── Launchpad.view.xml
│       │   │   ├── Profile.view.xml
│       │   │   ├── PurchaseRequisition.view.xml
│       │   │   ├── RFQ.view.xml
│       │   │   ├── Vendor.view.xml
│       │   │   ├── Material.view.xml
│       │   │   ├── PurchaseOrder.view.xml
│       │   │   ├── QualityInspection.view.xml
│       │   │   ├── GoodsReceipt.view.xml
│       │   │   ├── Invoice.view.xml
│       │   │   ├── PaymentRun.view.xml
│       │   │   └── Analytics.view.xml
│       │   │
│       │   ├── fragment/
│       │   │   ├── StatusDialog.fragment.xml
│       │   │   ├── AddVendorDialog.fragment.xml
│       │   │   ├── AddMaterialDialog.fragment.xml
│       │   │   ├── ConfirmActionDialog.fragment.xml
│       │   │   └── ErrorDetails.fragment.xml
│       │   │
│       │   ├── control/
│       │   │   ├── ProcessStep.control.js
│       │   │   ├── KPIBox.control.js
│       │   │   └── StatusBadge.control.js
│       │   │
│       │   ├── composite/
│       │   │   ├── ProcessCard.js
│       │   │   └── ProcessCard.control.xml
│       │   │
│       │   ├── lib/
│       │   │   ├── library.js
│       │   │   └── business/
│       │   │       ├── Formatter.js
│       │   │       ├── ProcessFlow.js
│       │   │       └── Authorization.js
│       │   │
│       │   ├── localService/
│       │   │   ├── metadata.xml
│       │   │   ├── mockserver.js
│       │   │   └── mockdata/
│       │   │
│       │   ├── model/
│       │   │   ├── formatter.js
│       │   │   └── models.js
│       │   │
│       │   ├── Component.js
│       │   ├── index.html
│       │   ├── manifest.json
│       │   └── test-resources/
│       │
│       ├── package.json
│       └── ui5.yaml
│
├── db/
│   ├── schema.cds
│   └── data/
│       ├── sap.cap.p2p-Users.csv
│       ├── sap.cap.p2p-UserRoles.csv
│       ├── sap.cap.p2p-Vendors.csv
│       ├── sap.cap.p2p-Materials.csv
│       ├── sap.cap.p2p-PurchaseRequisitions.csv
│       ├── sap.cap.p2p-PurchaseRequisitionItems.csv
│       ├── sap.cap.p2p-RFQs.csv
│       ├── sap.cap.p2p-PurchaseOrders.csv
│       ├── sap.cap.p2p-InspectionLots.csv
│       ├── sap.cap.p2p-GoodsReceipts.csv
│       ├── sap.cap.p2p-Invoices.csv
│       └── sap.cap.p2p-PaymentRuns.csv
│
├── srv/
│   ├── p2p-service.cds
│   ├── p2p-service.js
│   └── annotations.cds
│
├── xs-security.json
├── mta.yaml
├── package.json
├── README.md
└── AGENTS.md
```

---

# 7. CAP Data Model

Create namespace:

```cds
namespace sap.cap.p2p;

using { cuid, managed } from '@sap/cds/common';
```

## 7.1 Master Data Entities

### Users
```cds
entity Users : cuid, managed {
  userId        : String(50);
  fullName      : String(100);
  email         : String(100);
  companyCode   : String(10);
  costCenter    : String(30);
  language      : String(5);
  status        : String(20);
  roles         : Composition of many UserRoles on roles.user = $self;
}
```

### UserRoles
```cds
entity UserRoles : cuid, managed {
  user          : Association to Users;
  roleName      : String(50);
  module        : String(10);
  status        : String(20);
}
```

### Vendors
```cds
entity Vendors : cuid, managed {
  vendorNo      : String(20);
  name          : String(100);
  accountGroup  : String(20);
  purchOrg      : String(10);
  country       : String(5);
  city          : String(100);
  language      : String(5);
  telephone     : String(30);
  email         : String(100);
  paymentTerms  : String(20);
  currency      : String(5);
  taxNo         : String(30);
  incoterms     : String(10);
  bankKey       : String(30);
  bankAccount   : String(50);
  status        : String(20);
}
```

### Materials
```cds
entity Materials : cuid, managed {
  materialNo        : String(30);
  description       : String(200);
  materialType      : String(20);
  materialGroup     : String(30);
  baseUom           : String(10);
  grossWeight       : Decimal(15,3);
  netWeight         : Decimal(15,3);
  purchasingGroup   : String(10);
  plant             : String(10);
  valuationClass    : String(20);
  movingAvgPrice    : Decimal(15,2);
  minOrderQty       : Decimal(15,3);
  orderUnit         : String(10);
  status            : String(20);
}
```

---

## 7.2 Transactional Entities

### PurchaseRequisitions
```cds
entity PurchaseRequisitions : cuid, managed {
  prNo              : String(30);
  requisitioner     : String(50);
  purchasingOrg     : String(10);
  documentType      : String(10);
  requestDate       : Date;
  status            : String(30);
  totalItems        : Integer;
  items             : Composition of many PurchaseRequisitionItems on items.requisition = $self;
}
```

### PurchaseRequisitionItems
```cds
entity PurchaseRequisitionItems : cuid, managed {
  requisition       : Association to PurchaseRequisitions;
  itemNo            : Integer;
  material          : Association to Materials;
  shortText         : String(200);
  quantity          : Decimal(15,3);
  uom               : String(10);
  deliveryDate      : Date;
  plant             : String(10);
  accountAssignment : String(30);
}
```

### RFQs
```cds
entity RFQs : cuid, managed {
  rfqNo             : String(30);
  requisition       : Association to PurchaseRequisitions;
  rfqType           : String(10);
  purchasingOrg     : String(10);
  purchasingGroup   : String(10);
  submissionDeadline: Date;
  status            : String(30);
  vendors           : Composition of many RFQVendors on vendors.rfq = $self;
  items             : Composition of many RFQItems on items.rfq = $self;
}
```

### RFQVendors
```cds
entity RFQVendors : cuid, managed {
  rfq               : Association to RFQs;
  vendor            : Association to Vendors;
  sentStatus        : String(30);
  quotedAmount      : Decimal(15,2);
  responseStatus    : String(30);
}
```

### RFQItems
```cds
entity RFQItems : cuid, managed {
  rfq               : Association to RFQs;
  material          : Association to Materials;
  description       : String(200);
  quantity          : Decimal(15,3);
  uom               : String(10);
}
```

### PurchaseOrders
```cds
entity PurchaseOrders : cuid, managed {
  poNo              : String(30);
  rfq               : Association to RFQs;
  vendor            : Association to Vendors;
  purchasingOrg     : String(10);
  purchasingGroup   : String(10);
  companyCode       : String(10);
  currency          : String(5);
  documentDate      : Date;
  deliveryDate      : Date;
  status            : String(30);
  totalNetValue     : Decimal(15,2);
  items             : Composition of many PurchaseOrderItems on items.po = $self;
}
```

### PurchaseOrderItems
```cds
entity PurchaseOrderItems : cuid, managed {
  po                : Association to PurchaseOrders;
  itemNo            : Integer;
  material          : Association to Materials;
  quantity          : Decimal(15,3);
  uom               : String(10);
  unitPrice         : Decimal(15,2);
  netValue          : Decimal(15,2);
  plant             : String(10);
  storageLocation   : String(10);
}
```

### InspectionLots
```cds
entity InspectionLots : cuid, managed {
  inspectionLotNo   : String(30);
  inspectionType    : String(10);
  po                : Association to PurchaseOrders;
  material          : Association to Materials;
  vendor            : Association to Vendors;
  lotQty            : Decimal(15,3);
  acceptedQty       : Decimal(15,3);
  rejectedQty       : Decimal(15,3);
  usageDecisionCode : String(10);
  rejectionReason   : String(200);
  status            : String(30);
  characteristics   : Composition of many InspectionCharacteristics on characteristics.lot = $self;
}
```

### InspectionCharacteristics
```cds
entity InspectionCharacteristics : cuid, managed {
  lot               : Association to InspectionLots;
  characteristicId  : String(30);
  name              : String(100);
  specification     : String(100);
  actualValue       : String(100);
  result            : String(30);
}
```

### GoodsReceipts
```cds
entity GoodsReceipts : cuid, managed {
  grNo              : String(30);
  po                : Association to PurchaseOrders;
  inspectionLot     : Association to InspectionLots;
  postingDate       : Date;
  documentDate      : Date;
  plant             : String(10);
  storageLocation   : String(10);
  batch             : String(30);
  totalValue        : Decimal(15,2);
  status            : String(30);
  items             : Composition of many GoodsReceiptItems on items.gr = $self;
}
```

### GoodsReceiptItems
```cds
entity GoodsReceiptItems : cuid, managed {
  gr                : Association to GoodsReceipts;
  material          : Association to Materials;
  quantity          : Decimal(15,3);
  uom               : String(10);
  stockType         : String(50);
  movementType      : String(10);
  storageLocation   : String(10);
  unitPrice         : Decimal(15,2);
  lineValue         : Decimal(15,2);
}
```

### Invoices
```cds
entity Invoices : cuid, managed {
  invoiceNo         : String(30);
  invoiceRef        : String(50);
  vendor            : Association to Vendors;
  po                : Association to PurchaseOrders;
  gr                : Association to GoodsReceipts;
  invoiceDate       : Date;
  postingDate       : Date;
  currency          : String(5);
  paymentTerms      : String(20);
  poValue           : Decimal(15,2);
  grValue           : Decimal(15,2);
  invoiceValue      : Decimal(15,2);
  taxAmount         : Decimal(15,2);
  totalPayable      : Decimal(15,2);
  dueDate           : Date;
  matchStatus       : String(30);
  status            : String(30);
}
```

### PaymentRuns
```cds
entity PaymentRuns : cuid, managed {
  paymentRunNo      : String(30);
  runDate           : Date;
  companyCode       : String(10);
  paymentMethod     : String(10);
  nextPaymentDate   : Date;
  status            : String(30);
  totalPayment      : Decimal(15,2);
  items             : Composition of many PaymentRunItems on items.paymentRun = $self;
}
```

### PaymentRunItems
```cds
entity PaymentRunItems : cuid, managed {
  paymentRun        : Association to PaymentRuns;
  vendor            : Association to Vendors;
  invoice           : Association to Invoices;
  documentNo        : String(30);
  dueDate           : Date;
  grossAmount       : Decimal(15,2);
  discount          : Decimal(15,2);
  netPayment        : Decimal(15,2);
  selected          : Boolean;
  status            : String(30);
}
```

---

# 8. CAP Service Definition

Create `srv/p2p-service.cds`.

```cds
using sap.cap.p2p as db from '../db/schema';

service P2PService @(path: '/odata/v4/p2p') {

  @readonly
  entity CurrentUser as projection on db.Users;

  @requires: 'Admin'
  entity Users as projection on db.Users;

  @requires: ['Admin', 'ProcurementOfficer', 'FinanceOfficer']
  entity Vendors as projection on db.Vendors;

  @requires: ['Admin', 'ProcurementOfficer']
  entity Materials as projection on db.Materials;

  @requires: ['Admin', 'ProcurementOfficer']
  entity PurchaseRequisitions as projection on db.PurchaseRequisitions;

  @requires: ['Admin', 'ProcurementOfficer']
  entity PurchaseRequisitionItems as projection on db.PurchaseRequisitionItems;

  @requires: ['Admin', 'ProcurementOfficer']
  entity RFQs as projection on db.RFQs;

  @requires: ['Admin', 'ProcurementOfficer']
  entity PurchaseOrders as projection on db.PurchaseOrders;

  @requires: ['Admin', 'QCInspector']
  entity InspectionLots as projection on db.InspectionLots;

  @requires: ['Admin', 'QCInspector']
  entity InspectionCharacteristics as projection on db.InspectionCharacteristics;

  @requires: ['Admin', 'GoodsReceiptOfficer']
  entity GoodsReceipts as projection on db.GoodsReceipts;

  @requires: ['Admin', 'FinanceOfficer']
  entity Invoices as projection on db.Invoices;

  @requires: ['Admin', 'FinanceOfficer']
  entity PaymentRuns as projection on db.PaymentRuns;

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
}
```

---

# 9. Business Logic Requirements

Create `srv/p2p-service.js`.

## 9.1 Purchase Requisition Logic

- Before creating PR item:
  - Validate quantity > 0
  - Validate delivery date >= current date
- On `submitPurchaseRequisition`:
  - PR status changes from `Draft` to `Submitted`
- On `approvePurchaseRequisition`:
  - PR status changes from `Submitted` to `Approved`

## 9.2 RFQ Logic

- `createRFQFromPR`:
  - Only allowed if PR status is `Approved`
  - Copy PR items into RFQ items
  - Default status: `Draft`

- `issueRFQ`:
  - Requires at least one vendor
  - Status changes to `Issued`
  - Vendor sent status changes to `Sent`

## 9.3 PO Logic

- `createPOFromRFQ`:
  - Only allowed if RFQ status is `Vendor Selected`
  - Copy selected vendor and items
  - Calculate net value
  - Status: `Open`

- `approvePO`:
  - Status changes to `Approved`

## 9.4 Quality Inspection Logic

- Inspection lot can be created only for approved PO.
- Accepted quantity + rejected quantity must equal lot quantity.
- `postUsageDecision` updates status:
  - All accepted: `Accepted`
  - Partial accepted: `Partially Accepted`
  - All rejected: `Rejected`

## 9.5 Goods Receipt Logic

- `postGoodsReceipt` creates goods receipt from inspection lot.
- Accepted quantity gets movement type `101`.
- Rejected quantity gets movement type `122`.
- PO status changes to `Received` or `Partially Received`.

## 9.6 Invoice Logic

- `runThreeWayMatch` compares:
  - PO value
  - GR value
  - Invoice value
- If values match within tolerance, set `matchStatus = Matched`.
- If not, set `matchStatus = Mismatch`.

## 9.7 Payment Run Logic

- Payment run selects invoices with:
  - Status = `Payment Advice Created`
  - Due date <= next payment date
- Calculates total net payment.
- On execute, selected invoices become `Paid`.

---

# 10. OData V4 CRUD Requirements

All major entities must support CRUD where authorization allows:

| Entity | Create | Read | Update | Delete |
|---|---:|---:|---:|---:|
| Users | Admin | Admin/User | Admin | Admin |
| Vendors | Admin | Procurement/Finance | Admin | Admin |
| Materials | Admin | Procurement | Admin | Admin |
| PurchaseRequisitions | Procurement | Procurement/Admin | Procurement | Admin |
| RFQs | Procurement | Procurement/Admin | Procurement | Admin |
| PurchaseOrders | Procurement | Procurement/Admin | Procurement | Admin |
| InspectionLots | QC | QC/Admin | QC | Admin |
| GoodsReceipts | GR Officer | GR/Admin | GR Officer | Admin |
| Invoices | Finance | Finance/Admin | Finance | Admin |
| PaymentRuns | Finance | Finance/Admin | Finance | Admin |

---

# 11. Annotations Requirements

Create `srv/annotations.cds`.

Add annotations for:
- List reports
- Object pages
- Field groups
- Header info
- Identification
- Line item columns
- Selection fields
- Value help
- Charts
- KPI cards

## Example Annotation for Purchase Orders

```cds
using P2PService as service from './p2p-service';

annotate service.PurchaseOrders with @(
  UI.HeaderInfo: {
    TypeName: 'Purchase Order',
    TypeNamePlural: 'Purchase Orders',
    Title: { Value: poNo },
    Description: { Value: status }
  },
  UI.SelectionFields: [poNo, status, companyCode, vendor_ID],
  UI.LineItem: [
    { Value: poNo, Label: 'PO Number' },
    { Value: vendor.name, Label: 'Vendor' },
    { Value: totalNetValue, Label: 'Net Value' },
    { Value: deliveryDate, Label: 'Delivery Date' },
    { Value: status, Label: 'Status' }
  ]
);
```

## Analytical Annotation Ideas

Create analytical cards for:
- Total purchase orders by status
- Total spend by vendor
- PR to PO conversion count
- QC accepted vs rejected quantity
- Invoice match vs mismatch
- Payment due amount by vendor

---

# 12. Analytics and Visualization

Create an Analytics Overview page.

## KPIs

Show KPI cards:
- Total PRs
- Approved PRs
- Open RFQs
- Total POs
- Approved POs
- QC Rejection Rate
- Total GR Value
- Pending Invoice Amount
- Total Payment Run Amount

## Charts

Use UI5 VizFrame or suitable charting control.

Charts:
1. PO status donut chart
2. Spend by vendor bar chart
3. QC accepted vs rejected column chart
4. Invoice match status pie chart
5. Monthly procurement value line chart
6. Payment due by vendor bar chart

Backend read-only analytical projections:

```cds
entity POStatusAnalytics as select from db.PurchaseOrders {
  status,
  count(*) as total
} group by status;

entity VendorSpendAnalytics as select from db.PurchaseOrders {
  vendor.name as vendorName,
  sum(totalNetValue) as totalSpend
} group by vendor.name;
```

Expose analytics entities as read-only projections.

---

# 13. UI5 Frontend Implementation

## 13.1 Pages

Create these views:

1. `App.view.xml`
2. `Login.view.xml`
3. `Launchpad.view.xml`
4. `Profile.view.xml`
5. `PurchaseRequisition.view.xml`
6. `RFQ.view.xml`
7. `Vendor.view.xml`
8. `Material.view.xml`
9. `PurchaseOrder.view.xml`
10. `QualityInspection.view.xml`
11. `GoodsReceipt.view.xml`
12. `Invoice.view.xml`
13. `PaymentRun.view.xml`
14. `Analytics.view.xml`
15. `AccessDenied.view.xml`

## 13.2 Routing

Routes:

```json
{
  "routes": [
    { "pattern": "", "name": "launchpad", "target": "launchpad" },
    { "pattern": "profile", "name": "profile", "target": "profile" },
    { "pattern": "pr", "name": "purchaseRequisition", "target": "purchaseRequisition" },
    { "pattern": "rfq", "name": "rfq", "target": "rfq" },
    { "pattern": "vendors", "name": "vendors", "target": "vendors" },
    { "pattern": "materials", "name": "materials", "target": "materials" },
    { "pattern": "po", "name": "purchaseOrders", "target": "purchaseOrders" },
    { "pattern": "qc", "name": "qualityInspection", "target": "qualityInspection" },
    { "pattern": "gr", "name": "goodsReceipt", "target": "goodsReceipt" },
    { "pattern": "invoice", "name": "invoice", "target": "invoice" },
    { "pattern": "payment", "name": "paymentRun", "target": "paymentRun" },
    { "pattern": "analytics", "name": "analytics", "target": "analytics" },
    { "pattern": "access-denied", "name": "accessDenied", "target": "accessDenied" }
  ]
}
```

---

# 14. Part A: Login Screen with Roles Authentication - XSUAA

## Required Implementation

1. Create `xs-security.json`.
2. Define scopes:
   - `$XSAPPNAME.Admin`
   - `$XSAPPNAME.ProcurementOfficer`
   - `$XSAPPNAME.QCInspector`
   - `$XSAPPNAME.GoodsReceiptOfficer`
   - `$XSAPPNAME.FinanceOfficer`
   - `$XSAPPNAME.Viewer`

3. Define role templates:
   - Admin
   - ProcurementOfficer
   - QCInspector
   - GoodsReceiptOfficer
   - FinanceOfficer
   - Viewer

Example:

```json
{
  "xsappname": "sap-cap-p2p",
  "tenant-mode": "dedicated",
  "scopes": [
    { "name": "$XSAPPNAME.Admin", "description": "Admin access" },
    { "name": "$XSAPPNAME.ProcurementOfficer", "description": "Procurement access" },
    { "name": "$XSAPPNAME.QCInspector", "description": "Quality inspection access" },
    { "name": "$XSAPPNAME.GoodsReceiptOfficer", "description": "Goods receipt access" },
    { "name": "$XSAPPNAME.FinanceOfficer", "description": "Finance access" },
    { "name": "$XSAPPNAME.Viewer", "description": "Read-only access" }
  ],
  "role-templates": [
    { "name": "Admin", "description": "Admin", "scope-references": ["$XSAPPNAME.Admin"] },
    { "name": "ProcurementOfficer", "description": "Procurement Officer", "scope-references": ["$XSAPPNAME.ProcurementOfficer"] },
    { "name": "QCInspector", "description": "QC Inspector", "scope-references": ["$XSAPPNAME.QCInspector"] },
    { "name": "GoodsReceiptOfficer", "description": "Goods Receipt Officer", "scope-references": ["$XSAPPNAME.GoodsReceiptOfficer"] },
    { "name": "FinanceOfficer", "description": "Finance Officer", "scope-references": ["$XSAPPNAME.FinanceOfficer"] },
    { "name": "Viewer", "description": "Viewer", "scope-references": ["$XSAPPNAME.Viewer"] }
  ]
}
```

---

# 15. Part B: CAP CRUD App V4 with Annotation

## Required Implementation

Create OData V4 service with:
- Full CRUD for master and transaction entities
- Draft-like status handling
- CAP actions for business process transitions
- Fiori annotations for list/object layouts
- Value helps for vendors, materials, company code, plant, payment terms

Mandatory CAP actions:
- `submitPurchaseRequisition`
- `approvePurchaseRequisition`
- `createRFQFromPR`
- `issueRFQ`
- `createPOFromRFQ`
- `approvePO`
- `postUsageDecision`
- `postGoodsReceipt`
- `runThreeWayMatch`
- `createPaymentAdvice`
- `executePaymentRun`

---

# 16. Part C: Backend Data, Charts and Analytical App

## Required Implementation

Create analytical projections:

- `POStatusAnalytics`
- `VendorSpendAnalytics`
- `QCResultAnalytics`
- `InvoiceMatchAnalytics`
- `PaymentDueAnalytics`
- `MonthlyProcurementAnalytics`

Create frontend Analytics page:

- KPI section using cards
- Chart section using VizFrame
- Filter bar for date range, vendor, company code, material group
- Drilldown table below each chart

---

# 17. Part D: SAPUI5 Advanced Concepts

## 17.1 Fragment

Use XML fragments for reusable dialogs.

Required fragments:
- Add Vendor Dialog
- Add Material Dialog
- Confirm Submit Dialog
- Status Details Dialog
- Error Details Dialog

Example usage:
- In PR screen, use fragment for adding material line item.
- In RFQ screen, use fragment for adding vendors.
- In Payment screen, use confirmation dialog before executing payment run.

## 17.2 XML Composite

Create an XML composite control named `ProcessCard`.

Purpose:
Display each P2P process step card.

Properties:
- title
- subtitle
- transactionCode
- module
- status
- icon
- count

Use it on Launchpad and Process Overview screens.

## 17.3 Libraries

Create a small reusable UI5 library folder.

Library modules:
- `Formatter.js`
- `ProcessFlow.js`
- `Authorization.js`

Responsibilities:
- Format status colors
- Format currency
- Format dates
- Return next process step
- Check route authorization

## 17.4 Mock Server

Create mock server to test UI5 without CAP backend.

Mock server must:
- Load local `metadata.xml`
- Serve mock data from `localService/mockdata`
- Support PR, RFQ, PO, Vendor, Material, QC, GR, Invoice, Payment data

Use it through URL parameter:

```text
index.html?mock=true
```

## 17.5 Custom Control

Create custom control `StatusBadge`.

Properties:
- text
- status
- type

Behavior:
- Shows colored status badge
- Green for Approved/Posted/Paid
- Yellow for Draft/Open/Pending
- Red for Rejected/Blocked/Mismatch
- Blue for Submitted/In Progress

## 17.6 Extending Control

Create extended control based on `sap.m.Button`.

Name:
- `RoleButton`

Purpose:
- Button visible/enabled only when user has required role.

Properties:
- requiredRole
- actionName

Behavior:
- Checks user role from local user model
- Hides or disables itself automatically

---

# 18. Screen-Level Functional Requirements

## 18.1 Launchpad Screen

Must contain:
- Search bar
- User profile button
- Notification icon
- Module tile groups
- Recent activity table
- Process progress cards

## 18.2 Process Overview Screen

Must show all 9 P2P steps:
1. Purchase Item Request
2. Vendor RFQ
3. Vendor Master
4. Item Master
5. Purchase Order
6. Quality Inspection
7. Transfer to Inventory
8. Payment Advice
9. Payment Processing

Each step should display:
- Step number
- Title
- Transaction code
- Module
- Status
- Navigation arrow

## 18.3 PR Screen

Must show:
- Header form
- Line item table
- Save button
- Submit button
- Approve button

## 18.4 RFQ Screen

Must show:
- RFQ header
- Invited vendor table
- Items required table
- Add vendor button
- Issue RFQ button

## 18.5 Vendor Screen

Must show:
- Vendor object page
- Address section
- Payment and tax section
- Bank section

## 18.6 Material Screen

Must show:
- Material object page
- Basic data section
- Purchasing data section
- Valuation data section

## 18.7 PO Screen

Must show:
- KPI cards: total POs, approved, open, blocked
- PO table
- Create PO button
- Approve PO action

## 18.8 QC Screen

Must show:
- Inspection lot header
- Characteristics table
- Usage decision form
- Post usage decision button

## 18.9 GR Screen

Must show:
- Goods receipt header
- Movement line items
- Storage location section
- Account assignment section
- Post button

## 18.10 Invoice Screen

Must show:
- Invoice header
- 3-way match table
- Payment summary
- Simulate button
- Post button
- Raise payment advice button

## 18.11 Payment Run Screen

Must show:
- Run parameters
- Payment run status checklist
- Payment proposal table
- Selected payment total
- Execute button

---

# 19. Sample Seed Data

Use these sample values from the reference process.

## Vendors

| Vendor No | Name | City | Currency | Payment Terms |
|---|---|---|---|---|
| V-10001 | Alpha Supplies Ltd | Bengaluru | USD | Z030 |
| V-10002 | Beta Industrial Co | Pune | USD | Z014 |
| V-10003 | Gamma Corporation | Mumbai | USD | Z030 |
| V-10004 | Delta Traders Ltd | Delhi | USD | Z045 |

## Materials

| Material No | Description | UoM | Price |
|---|---|---:|---:|
| MAT-1001 | Industrial Pump XL-200 | EA | 250.00 |
| MAT-2041 | Spare Parts Kit Type-A | SET | 420.00 |
| MAT-3012 | Control Valve CV-50 | PC | 150.00 |
| MAT-4001 | Industrial Fastener Set | EA | 20.00 |

## Purchase Orders

| PO No | Vendor | Material | Qty | Net Value | Status |
|---|---|---|---:|---:|---|
| 4500001001 | Alpha Supplies Ltd | MAT-1001 | 50 | 12500.00 | Approved |
| 4500001002 | Beta Industrial Co | MAT-2041 | 10 | 4200.00 | Open |
| 4500001003 | Gamma Corporation | MAT-3012 | 25 | 3750.00 | Open |
| 4500001004 | Delta Traders Ltd | MAT-4001 | 100 | 2000.00 | Blocked |
| 4500001005 | Alpha Supplies Ltd | MAT-1001 | 30 | 7500.00 | Approved |

---

# 20. UI Styling Requirements

Use SAP Fiori-like design.

Design principles:
- Clean enterprise layout
- Cards and tiles
- Shell/header bar
- Blue/white SAP-like theme
- Responsive design
- Mobile-friendly layout
- Semantic colors for status

Use UI5 controls:
- `sap.m.App`
- `sap.m.Page`
- `sap.m.ShellBar`
- `sap.m.TileContainer` or `sap.m.GenericTile`
- `sap.m.Table`
- `sap.m.ObjectHeader`
- `sap.m.ObjectStatus`
- `sap.m.MessageToast`
- `sap.m.MessageBox`
- `sap.ui.comp.smartfilterbar.SmartFilterBar` if applicable
- `sap.viz.ui5.controls.VizFrame` for charts

---

# 21. Validation Rules

## Generic
- Required fields cannot be empty
- Dates must be valid
- Amounts must be positive
- Quantity must be positive
- Status transitions must follow process order

## Process Transition Order

```text
PR Draft
 -> PR Submitted
 -> PR Approved
 -> RFQ Draft
 -> RFQ Issued
 -> Vendor Selected
 -> PO Open
 -> PO Approved
 -> QC In Inspection
 -> QC Usage Decision Posted
 -> GR Posted
 -> Invoice Posted
 -> Payment Advice Created
 -> Payment Posted
```

---

# 22. Error Handling

Backend must return clear error messages.

Examples:
- `Cannot create RFQ. Purchase Requisition is not approved.`
- `Cannot issue RFQ. At least one vendor is required.`
- `Cannot post usage decision. Accepted and rejected quantity must equal lot quantity.`
- `Cannot post invoice. 3-way match failed.`
- `Cannot execute payment run. No selected payment items found.`

Frontend must show:
- MessageToast for success
- MessageBox.error for critical failures
- Error details fragment for backend validation messages

---

# 23. Testing Requirements

## Backend Tests

Test:
- CRUD for each entity
- Role-based authorization
- PR approval flow
- RFQ creation flow
- PO creation flow
- QC decision validation
- GR posting movement types
- Invoice 3-way match
- Payment run execution

## Frontend Tests

Test:
- Navigation route access
- Launchpad tile visibility by role
- Form validations
- Fragment dialogs
- Custom controls
- Mock server mode
- Chart loading

---

# 24. Deployment Requirements

## Local Development

Commands:

```bash
npm install
cds watch
```

Run UI5 app:

```bash
cd app/p2p-ui
npm install
ui5 serve
```

## SAP BTP Deployment

Use:
- Cloud Foundry runtime
- XSUAA service
- HTML5 Application Repository
- Destination service
- SAP HANA Cloud or HDI container

Required files:
- `mta.yaml`
- `xs-security.json`
- `package.json`
- `manifest.json`

---

# 25. MCP Rules for Codex / Agent

Create `AGENTS.md`:

```md
# SAP CAP + UI5 Agent Rules

## CAP Rules

- Before creating or modifying CDS models, search CAP documentation using the CAP MCP server.
- Before changing entities, associations, annotations, or services, inspect the existing CDS model using `cds-mcp search_model`.
- Use OData V4 service style.
- Use CAP actions for business transitions.
- Do not bypass role restrictions.

## UI5 Rules

- Before generating UI5 code, retrieve UI5 guidelines using the UI5 MCP server.
- Before using UI5 controls, check API reference using UI5 MCP `get_api_reference`.
- Validate `manifest.json` with UI5 MCP `run_manifest_validation`.
- Run UI5 linter after UI code generation.

## Project Rules

- Build backend first, then frontend.
- Keep all business logic in CAP service handlers.
- Keep UI formatting in frontend formatter/library modules.
- Use fragments for reusable dialogs.
- Use custom controls for reusable status UI.
- Use XML composite for process cards.
- Use mock server for frontend independent testing.
```

---

# 26. Codex Implementation Prompt

Use the following prompt in Codex:

```text
You are building a full stack SAP CAP + SAPUI5 Procure-to-Pay project.

Use this implementation guide exactly.

Project name: sap-cap-p2p
Backend: SAP CAP Node.js, CDS, OData V4, SQLite local, XSUAA roles
Frontend: SAPUI5 freestyle XML app with routing, fragments, custom controls, XML composite, reusable library, mock server, and analytics charts

Build in this order:

1. Create CAP project structure.
2. Create db/schema.cds with all master and transactional entities.
3. Create srv/p2p-service.cds with OData V4 projections and actions.
4. Create srv/p2p-service.js with validations and business transitions.
5. Create srv/annotations.cds for Fiori UI metadata and analytics.
6. Create CSV seed data for users, roles, vendors, materials, PRs, RFQs, POs, QC lots, GRs, invoices, and payment runs.
7. Create xs-security.json with Admin, ProcurementOfficer, QCInspector, GoodsReceiptOfficer, FinanceOfficer, and Viewer roles.
8. Create SAPUI5 app under app/p2p-ui.
9. Create manifest routing for launchpad, profile, PR, RFQ, vendors, materials, PO, QC, GR, invoice, payment, analytics, and access denied.
10. Create all XML views and controllers.
11. Add role-based tile visibility and route guarding.
12. Add XML fragments for dialogs.
13. Add XML composite ProcessCard.
14. Add custom controls StatusBadge, KPIBox, and ProcessStep.
15. Add reusable library modules Formatter, ProcessFlow, and Authorization.
16. Add local mock server support with index.html?mock=true.
17. Add analytics page with KPI cards and charts.
18. Add README with setup, run, test, and deployment instructions.

Important business flow:
Login -> Launchpad -> Profile -> PR -> RFQ -> Vendor -> Material -> PO -> QC -> GR -> Invoice -> Payment Run.

Important validations:
- Quantity must be positive.
- Delivery date cannot be in the past.
- RFQ can be created only from approved PR.
- PO can be created only after vendor selection.
- GR can be posted only after usage decision.
- Invoice payment advice can be created only after successful 3-way match.
- Payment run can execute only selected due invoices.

Use SAP Fiori-like responsive design.
Use clean enterprise coding style.
Do not leave TODO placeholders.
Generate working files.
```

---

# 27. Acceptance Criteria

The project is complete when:

- CAP server runs with `cds watch`.
- OData V4 endpoint `/odata/v4/p2p` is available.
- CRUD works for all required entities.
- Role restrictions are implemented.
- UI5 app loads successfully.
- Launchpad shows role-based tiles.
- User can complete full P2P flow from PR to Payment.
- Analytics page shows KPI cards and charts.
- Fragments are used for dialogs.
- XML composite control is implemented.
- Custom controls are implemented.
- UI5 library modules are used.
- Mock server works with `index.html?mock=true`.
- Manifest validation passes.
- UI5 linter passes.
- README explains setup and usage.

---

# 28. Final Deliverable

The final project should demonstrate:

- Part A: Login screen with role authentication using XSUAA
- Part B: CAP CRUD app using OData V4 and annotations
- Part C: Backend data with charts and analytical overview app
- Part D: UI5 fragment, XML composite, libraries, mock server, custom control, and extending control

