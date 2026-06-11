const cds = require('@sap/cds');

const today = () => new Date().toISOString().slice(0, 10);
const nextId = (prefix) => {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${stamp}${suffix}`;
};

const GENERATED_BUSINESS_IDS = new Map([
  ['Vendors', ['vendorNo', 'VEN']],
  ['Materials', ['materialNo', 'MAT']],
  ['PurchaseRequisitions', ['prNo', 'PR']],
  ['RFQs', ['rfqNo', 'RFQ']],
  ['PurchaseOrders', ['poNo', 'PO']],
  ['InspectionLots', ['inspectionLotNo', 'LOT']],
  ['GoodsReceipts', ['grNo', 'GR']],
  ['Invoices', ['invoiceNo', 'INV']],
  ['PaymentRuns', ['paymentRunId', 'PAY']]
]);
const BTP_ROLES = [
  'P2P_ADMIN',
  'P2P_BUYER',
  'P2P_REQUESTER',
  'P2P_VENDOR_MANAGER',
  'P2P_QUALITY_INSPECTOR',
  'P2P_AP_CLERK',
  'P2P_FINANCE_MANAGER'
];

module.exports = cds.service.impl(async function () {
  const {
    CurrentUser,
    Users: ServiceUsers,
    Vendors,
    Materials,
    PurchaseRequisitions,
    RFQs,
    PurchaseOrders,
    InspectionLots,
    GoodsReceipts,
    Invoices,
    PaymentRuns
  } = this.entities;
  const {
    Users,
    UserRoles,
    PurchaseRequisitionItems,
    RFQVendors,
    RFQItems,
    PurchaseOrderItems,
    GoodsReceiptItems,
    PaymentRunItems
  } = cds.entities('sap.cap.p2p');

  const getBtpRoles = (req) => {
    const detectedRoles = new Set();
    const btpDebug = {
      id: req.user && req.user.id,
      attr: req.user && req.user.attr,
      roleChecks: {},
      rawRoles: [],
      detectedRoles: []
    };

    console.log("=== BTP USER DEBUG ===");
    console.log("ID:", req.user && req.user.id);
    console.log("ATTR:", req.user && req.user.attr);
    console.log("ROLES:", (req.user && req.user._roles) || (req.user && req.user.roles));

    try {
      const safeUser = {};
      if (req.user) {
        for (const key in req.user) {
          if (key !== 'req' && key !== 'res' && key !== 'tenantInfo' && key !== 'tokenInfo' && typeof req.user[key] !== 'function') {
            safeUser[key] = req.user[key];
          }
        }
      }
      console.log("USER OBJECT:", JSON.stringify(safeUser, null, 2));
    } catch (e) {
      console.log("USER OBJECT: [Could not stringify]");
    }

    // Priority 1: req.user.is(role)
    BTP_ROLES.forEach((role) => {
      const hasRole = req.user && typeof req.user.is === 'function' && req.user.is(role);
      btpDebug.roleChecks[role] = hasRole;
      if (hasRole) detectedRoles.add(role);
    });

    // Collect all possible raw roles/scopes
    if (req.user) {
      // Priority 2: req.user._roles
      if (Array.isArray(req.user._roles)) btpDebug.rawRoles.push(...req.user._roles);
      else if (req.user._roles && typeof req.user._roles === 'object') btpDebug.rawRoles.push(...Object.keys(req.user._roles));

      // Priority 3: req.user.roles
      if (Array.isArray(req.user.roles)) btpDebug.rawRoles.push(...req.user.roles);
      else if (req.user.roles && typeof req.user.roles === 'object') btpDebug.rawRoles.push(...Object.keys(req.user.roles));

      // Priority 4: req.user.attr scopes
      if (req.user.attr) {
        if (Array.isArray(req.user.attr.scope)) btpDebug.rawRoles.push(...req.user.attr.scope);
        else if (typeof req.user.attr.scope === 'string') btpDebug.rawRoles.push(req.user.attr.scope);

        if (Array.isArray(req.user.attr.scopes)) btpDebug.rawRoles.push(...req.user.attr.scopes);
      }

      // Priority 5: JWT payload scopes
      if (req.user.tokenInfo && typeof req.user.tokenInfo.getPayload === 'function') {
         const payload = req.user.tokenInfo.getPayload();
         if (payload && Array.isArray(payload.scope)) {
           btpDebug.rawRoles.push(...payload.scope);
         }
      }
    }

    // Detect roles from collected scopes (e.g. sap-cap-p2p-dev.P2P_ADMIN)
    btpDebug.rawRoles.forEach((rawRole) => {
      BTP_ROLES.forEach((role) => {
        if (rawRole === role || rawRole.endsWith(`.${role}`)) {
          detectedRoles.add(role);
        }
      });
    });

    btpDebug.detectedRoles = Array.from(detectedRoles);

    if (detectedRoles.size === 0) {
      console.warn("=== NO ROLES DETECTED FOR USER ===");
      console.warn("Available Auth Info:", JSON.stringify(btpDebug, null, 2));
    }

    return { roles: Array.from(detectedRoles), btpDebug };
  };

  const getCurrentUserContext = async (req, requestedUserId) => {
    const userId = requestedUserId || req.user.id || 'anonymous';
    const { roles, btpDebug } = getBtpRoles(req);
    const user = await SELECT.one.from(Users).where({ userId });
    const attr = req.user && req.user.attr || {};

    return {
      ID: user && user.ID,
      userId,
      fullName: user && user.fullName || attr.given_name && attr.family_name && `${attr.given_name} ${attr.family_name}` || userId,
      email: user && user.email || attr.email || '',
      companyCode: user && user.companyCode || '',
      costCenter: user && user.costCenter || '',
      language: user && user.language || 'EN',
      status: user && user.status || 'Active',
      roles: roles.map((roleName) => ({
        roleName,
        module: 'BTP',
        status: 'Active'
      })),
      btpDebug
    };
  };

  const getRequestedId = (req) => {
    const key = req.params && req.params[0];
    return req.data.ID || (key && (key.ID || key));
  };

  const isAdminUser = (user) => {
    return String((user && user.userId) || "").toLowerCase() === "admin";
  };

  const isCountQuery = (req) => {
    const columns = req.query && req.query.SELECT && req.query.SELECT.columns || [];
    return columns.some((column) => column.func === 'count');
  };

  const getField = (entity, ...candidates) => {
    if (!entity || !entity.elements) return candidates[0];
    return candidates.find(c => entity.elements[c]) || candidates[0];
  };

  this.on('READ', CurrentUser, async (req) => {
    const user = await getCurrentUserContext(req);
    if (req.query.SELECT.one) return user;

    const result = [user];
    result.$count = 1;
    return result;
  });

  this.on('READ', ServiceUsers, async (req) => {
    const id = getRequestedId(req);

    if (id) {
      const user = await SELECT.one.from(Users).where({ ID: id });
      return user || req.error(404, 'User not found.');
    }

    const rows = await SELECT.from(Users).orderBy('userId');
    if (isCountQuery(req)) {
      return [{ $count: rows.length }];
    }

    rows.$count = rows.length;
    return rows;
  });

  this.before(['CREATE', 'UPDATE'], [PurchaseOrders, GoodsReceipts, Invoices, PaymentRuns], (req) => {
    for (const field of ['totalNetValue', 'totalGRValue', 'netAmount', 'taxAmount', 'totalPayable', 'totalPaymentAmount']) {
      if (req.data[field] !== undefined && Number(req.data[field]) < 0) req.error(400, 'Amounts must be positive.');
    }
  });

  for (const [entityName, [fieldName, prefix]] of GENERATED_BUSINESS_IDS.entries()) {
    const entity = this.entities[entityName];
    this.before('CREATE', entity, (req) => {
      req.data[fieldName] = nextId(prefix);
      
      if (entityName === 'PurchaseRequisitions') { req.data.status = 'CREATED'; req.data.assignedRole = 'P2P_REQUESTER'; }
      else if (entityName === 'RFQs') { req.data.status = 'DRAFT'; req.data.assignedRole = 'P2P_VENDOR_MANAGER'; }
      else if (entityName === 'PurchaseOrders') { req.data.status = 'DRAFT'; req.data.assignedRole = 'P2P_BUYER'; }
      else if (entityName === 'InspectionLots') { req.data.status = 'OPEN'; req.data.assignedRole = 'P2P_QUALITY_INSPECTOR'; }
      else if (entityName === 'GoodsReceipts') { req.data.status = 'DRAFT'; req.data.assignedRole = 'P2P_AP_CLERK'; }
      else if (entityName === 'Invoices') { req.data.status = 'DRAFT'; req.data.assignedRole = 'P2P_FINANCE_MANAGER'; }
      else if (entityName === 'PaymentRuns') { req.data.status = 'DRAFT'; req.data.assignedRole = 'P2P_FINANCE_MANAGER'; }
    });
  }

  this.before('CREATE', ServiceUsers, async (req) => {
    if (isAdminUser(req.data)) {
      return req.error(403, 'The protected admin user already exists and cannot be recreated.');
    }
  });

  this.before(['UPDATE', 'DELETE'], ServiceUsers, async (req) => {
    const id = getRequestedId(req);
    const user = id ? await SELECT.one.from(ServiceUsers).where({ ID: id }) : null;

    if (isAdminUser(user)) {
      return req.error(403, 'The admin user cannot be changed or deleted.');
    }

    if (req.event === 'DELETE' && id) {
      await DELETE.from(UserRoles).where({ user_ID: id });
    }
  });

  this.on('getCurrentUser', async (req) => {
    const user = await getCurrentUserContext(req);
    if (!user.roles.length) {
      console.warn('getCurrentUser called but user has no BTP roles. Returning diagnostic information.');
    }
    return user;
  });

  // Central Audit and History Logger
  const logHistory = async (docType, docId, prevStatus, newStatus, action, user, comments) => {
    try {
      const { WorkflowHistory } = cds.entities('sap.cap.p2p');
      if (WorkflowHistory) {
        await INSERT.into(WorkflowHistory).entries({
          ID: cds.utils.uuid(), DocumentType: docType, DocumentId: String(docId),
          PreviousStatus: String(prevStatus), NewStatus: String(newStatus), Action: action,
          User: String(user || 'system'), Timestamp: new Date().toISOString(), Comments: comments
        });
      }
    } catch(e) {
      console.warn("Could not write to WorkflowHistory.", e.message);
    }
  };

  this.on('submitPurchaseRequisition', async (req) => {
    const prId = req.data.prId;
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    if (pr.status !== 'CREATED' && pr.status !== 'REJECTED') return req.error(400, 'Invalid status for submission.');
    await UPDATE(PurchaseRequisitions).set({ status: 'SUBMITTED', assignedRole: 'P2P_BUYER' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'SUBMITTED', 'Submit PR', req.user && req.user.id, 'Submitted to Procurement');
    return JSON.stringify({ message: "PR Submitted", currentEntity: "PurchaseRequisitions", currentId: pr.ID, currentStatus: "SUBMITTED", nextAssignedRole: "P2P_BUYER", nextWorkflowStage: "PR_APPROVAL" });
  });

  this.on('approvePurchaseRequisition', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    if (pr.status !== 'SUBMITTED') return req.error(400, 'PR is not submitted.');
    await UPDATE(PurchaseRequisitions).set({ status: 'APPROVED', assignedRole: 'COMPLETED' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'APPROVED', 'Approve PR', req.user && req.user.id, req.data.comments || 'PR Approved');

    // Auto-Forward: Create RFQ
    const items = await SELECT.from(PurchaseRequisitionItems).where({ requisition_ID: pr.ID });
    const rfqId = cds.utils.uuid();
    
    const rfqPrField = getField(RFQs, 'requisition_ID', 'sourcePR_ID');
    const rfqEntry = {
      ID: rfqId, rfqNo: nextId('RFQ'), status: 'DRAFT', assignedRole: 'P2P_VENDOR_MANAGER',
      purchasingOrg: pr.purchasingOrg, submissionDeadline: today()
    };
    rfqEntry[rfqPrField] = pr.ID;
    await INSERT.into(RFQs).entries(rfqEntry);

    if (items.length > 0) {
      const rfqItemField = getField(RFQItems, 'rfq_ID', 'sourceRFQ_ID');
      await INSERT.into(RFQItems).entries(items.map(item => {
        const entry = { ID: cds.utils.uuid(), material_ID: item.material_ID, quantity: item.quantity, uom: item.uom, description: item.shortText };
        entry[rfqItemField] = rfqId;
        return entry;
      }));
    }
    
    return JSON.stringify({ message: "PR Approved and RFQ Task created", currentEntity: "PurchaseRequisitions", currentId: pr.ID, currentStatus: "APPROVED", nextEntity: "RFQs", nextId: rfqId, nextAssignedRole: "P2P_VENDOR_MANAGER", nextWorkflowStage: "RFQ_CREATION" });
  });

  this.on('rejectPurchaseRequisition', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    await UPDATE(PurchaseRequisitions).set({ status: 'REJECTED', assignedRole: 'P2P_REQUESTER' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'REJECTED', 'Reject PR', req.user && req.user.id, req.data.comments);
    return JSON.stringify({ message: "PR Rejected", currentEntity: "PurchaseRequisitions", currentId: pr.ID, currentStatus: "REJECTED", nextAssignedRole: "P2P_REQUESTER" });
  });

  this.on('addVendorToRFQ', async (req) => {
    const { rfqId, vendorId } = req.data;
    const rfqVendField = getField(RFQVendors, 'rfq_ID', 'sourceRFQ_ID');
    const entry = { ID: cds.utils.uuid(), vendor_ID: vendorId, sentStatus: 'Pending', responseStatus: 'Pending', quotedAmount: 0 };
    entry[rfqVendField] = rfqId;
    await INSERT.into(RFQVendors).entries(entry);
    await UPDATE(RFQs).set({ status: 'VENDORS_ASSIGNED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "Vendor Added", entity: "RFQs", id: rfqId, status: "VENDORS_ASSIGNED" });
  });

  this.on('issueRFQ', async (req) => {
    const { rfqId } = req.data;
    const rfqVendField = getField(RFQVendors, 'rfq_ID', 'sourceRFQ_ID');
    await UPDATE(RFQVendors).set({ sentStatus: 'Sent' }).where({ [rfqVendField]: rfqId });
    await UPDATE(RFQs).set({ status: 'ISSUED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "RFQ Issued", entity: "RFQs", id: rfqId, status: "ISSUED" });
  });

  this.on('receiveQuotation', async (req) => {
    const { rfqId, vendorId, quotedAmount, leadTime, remarks } = req.data;
    const rfqVendField = getField(RFQVendors, 'rfq_ID', 'sourceRFQ_ID');
    await UPDATE(RFQVendors).set({ quotedAmount, leadTime, remarks, responseStatus: 'RECEIVED' }).where({ [rfqVendField]: rfqId, vendor_ID: vendorId });
    await UPDATE(RFQs).set({ status: 'QUOTATIONS_RECEIVED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "Quotation Received", entity: "RFQs", id: rfqId, status: "QUOTATIONS_RECEIVED" });
  });

  this.on('selectVendor', async (req) => {
    const { rfqId, vendorId } = req.data;
    const rfqVendField = getField(RFQVendors, 'rfq_ID', 'sourceRFQ_ID');
    await UPDATE(RFQs).set({ selectedVendor_ID: vendorId, status: 'VENDOR_SELECTED' }).where({ ID: rfqId });
    await UPDATE(RFQVendors).set({ responseStatus: 'SELECTED' }).where({ [rfqVendField]: rfqId, vendor_ID: vendorId });
    return JSON.stringify({ message: "Vendor Selected", currentEntity: "RFQs", currentId: rfqId, currentStatus: "VENDOR_SELECTED", nextAssignedRole: "P2P_BUYER" });
  });

  this.on('createOrGetPOFromRFQ', async (req) => {
    try {
      const { rfqId, deliveryDate, currency, companyCode, purchasingOrg, purchasingGroup } = req.data;
      if (!rfqId) return req.error(400, "RFQ ID is required.");
      
      const poRfqField = getField(PurchaseOrders, 'rfq_ID', 'sourceRFQ_ID');
      const existingPO = await SELECT.one.from(PurchaseOrders).where({ [poRfqField]: rfqId });
      if (existingPO) return JSON.stringify({ message: "PO exists.", currentEntity: "PurchaseOrders", currentId: existingPO.ID, currentStatus: existingPO.status });

      const rfq = await SELECT.one.from(RFQs).where({ ID: rfqId });
      if (!rfq) return req.error(404, "RFQ not found.");
      
      const itemRfqField = getField(RFQItems, 'rfq_ID', 'sourceRFQ_ID');
      const items = await SELECT.from(RFQItems).where({ [itemRfqField]: rfqId }) || [];
      
      const quoteRfqField = getField(RFQVendors, 'rfq_ID', 'sourceRFQ_ID');
      const quotes = await SELECT.one.from(RFQVendors).where({ [quoteRfqField]: rfqId, responseStatus: 'SELECTED' });
      
      const poId = cds.utils.uuid();
      const vendorId = quotes ? quotes.vendor_ID : (rfq.selectedVendor_ID || null);
      const totalNetValue = quotes && quotes.quotedAmount ? Number(quotes.quotedAmount) : 0;

      const poEntry = {
        ID: poId, poNo: nextId('PO'), vendor_ID: vendorId, status: 'DRAFT', assignedRole: 'P2P_BUYER',
        currency: currency || 'USD', documentDate: today(), deliveryDate: deliveryDate || today(), companyCode: companyCode || null, purchasingOrg: purchasingOrg || null, purchasingGroup: purchasingGroup || null, totalNetValue: totalNetValue
      };
      poEntry[poRfqField] = rfqId;
      await INSERT.into(PurchaseOrders).entries(poEntry);

      if (items.length > 0) {
        const poItemPoField = getField(PurchaseOrderItems, 'po_ID', 'purchaseOrder_ID');
        await INSERT.into(PurchaseOrderItems).entries(items.map(item => {
          const entry = { ID: cds.utils.uuid(), material_ID: item.material_ID, quantity: item.quantity, uom: item.uom };
          entry[poItemPoField] = poId;
          return entry;
        }));
      }
      await UPDATE(RFQs).set({ status: 'PO_CREATED', assignedRole: 'COMPLETED' }).where({ ID: rfqId });
      return JSON.stringify({ message: "PO Task created", currentEntity: "RFQs", currentId: rfqId, currentStatus: "PO_CREATED", nextEntity: "PurchaseOrders", nextId: poId, nextAssignedRole: "P2P_BUYER", nextWorkflowStage: "PO_CREATION" });
    } catch (error) {
      console.error("Create PO Error:", error);
      return req.error(500, "Failed to create PO: " + error.message);
    }
  });

  this.on('submitPO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    await UPDATE(PurchaseOrders).set({ status: 'PENDING_APPROVAL' }).where({ ID: po.ID });
    return JSON.stringify({ message: "PO Submitted for approval", currentEntity: "PurchaseOrders", currentId: po.ID, currentStatus: "PENDING_APPROVAL", nextAssignedRole: "P2P_BUYER" });
  });

  this.on('approvePO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    await UPDATE(PurchaseOrders).set({ status: 'APPROVED', assignedRole: 'COMPLETED' }).where({ ID: po.ID });
    await logHistory('PurchaseOrders', po.ID, po.status, 'APPROVED', 'Approve PO', req.user && req.user.id, req.data.comments);

    // Auto-Forward: Create GR Task
    const grId = cds.utils.uuid();
    const grPoField = getField(GoodsReceipts, 'po_ID', 'purchaseOrder_ID');
    const grEntry = {
      ID: grId, grNo: nextId('GR'), 
      postingDate: today(), documentDate: today(), 
      plant: '1000', storageLocation: 'RM01', totalValue: po.totalNetValue || 0, status: 'DRAFT', assignedRole: 'P2P_AP_CLERK'
    };
    grEntry[grPoField] = po.ID;
    await INSERT.into(GoodsReceipts).entries(grEntry);
    
    return JSON.stringify({ message: "PO Approved and Goods Receipt task created", currentEntity: "PurchaseOrders", currentId: po.ID, currentStatus: "APPROVED", nextEntity: "GoodsReceipts", nextId: grId, nextAssignedRole: "P2P_AP_CLERK", nextWorkflowStage: "GOODS_RECEIPT" });
  });

  this.on('rejectPO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    await UPDATE(PurchaseOrders).set({ status: 'REJECTED', assignedRole: 'P2P_BUYER' }).where({ ID: po.ID });
    return JSON.stringify({ message: "PO Rejected", currentEntity: "PurchaseOrders", currentId: po.ID, currentStatus: "REJECTED", nextAssignedRole: "P2P_BUYER" });
  });

  this.on('postGoodsReceipt', async (req) => {
    const { grId, postingDate, documentDate, plant, storageLocation, batch } = req.data;
    const gr = await SELECT.one.from(GoodsReceipts).where({ ID: grId });
    await UPDATE(GoodsReceipts).set({ status: 'POSTED', assignedRole: 'COMPLETED', postingDate, documentDate, plant, storageLocation, batch }).where({ ID: grId });

    // Auto-Forward: Create QC Task
    const lotId = cds.utils.uuid();
    const lotPoField = getField(InspectionLots, 'po_ID', 'purchaseOrder_ID');
    const lotEntry = { ID: lotId, inspectionLotNo: nextId('LOT'), status: 'OPEN', assignedRole: 'P2P_QUALITY_INSPECTOR' };
    lotEntry[lotPoField] = gr.po_ID || gr.purchaseOrder_ID;
    await INSERT.into(InspectionLots).entries(lotEntry);

    const grLotField = getField(GoodsReceipts, 'inspectionLot_ID', 'lot_ID');
    await UPDATE(GoodsReceipts).set({ [grLotField]: lotId }).where({ ID: grId });
    
    return JSON.stringify({ message: "Goods Receipt Posted and QC Task created", currentEntity: "GoodsReceipts", currentId: grId, currentStatus: "POSTED", nextEntity: "InspectionLots", nextId: lotId, nextAssignedRole: "P2P_QUALITY_INSPECTOR", nextWorkflowStage: "QC_INSPECTION" });
  });

  this.on('postUsageDecision', async (req) => {
    const { lotId, acceptedQuantity, rejectedQuantity, usageDecisionCode, rejectionReason } = req.data;
    const lot = await SELECT.one.from(InspectionLots).where({ ID: lotId });
    
    const status = (usageDecisionCode === 'FAIL' || Number(rejectedQuantity) > 0) ? 'FAILED' : 'PASSED';
    await UPDATE(InspectionLots).set({ acceptedQuantity, rejectedQuantity, usageDecisionCode, rejectionReason, status, assignedRole: 'COMPLETED' }).where({ ID: lot.ID });

    if (status === 'PASSED') {
      const invId = cds.utils.uuid();
      const invPoField = getField(Invoices, 'po_ID', 'purchaseOrder_ID');
      const invEntry = {
        ID: invId, invoiceNo: nextId('INV'), status: 'DRAFT', assignedRole: 'P2P_FINANCE_MANAGER',
        invoiceDate: today(), postingDate: today(), dueDate: today(), matchStatus: 'Pending'
      };
      invEntry[invPoField] = lot.po_ID || lot.purchaseOrder_ID;
      await INSERT.into(Invoices).entries(invEntry);
      return JSON.stringify({ message: "QC Passed and Invoice Task created", currentEntity: "InspectionLots", currentId: lot.ID, currentStatus: "PASSED", nextEntity: "Invoices", nextId: invId, nextAssignedRole: "P2P_FINANCE_MANAGER", nextWorkflowStage: "INVOICE_VERIFICATION" });
    }
    
    return JSON.stringify({ message: "QC Completed (Failed)", currentEntity: "InspectionLots", currentId: lot.ID, currentStatus: "FAILED", nextAssignedRole: "NONE" });
  });

  this.on('verifyInvoice', async (req) => {
    const invoice = await SELECT.one.from(Invoices).where({ ID: req.data.invoiceId });
    await UPDATE(Invoices).set({ status: 'VERIFIED', matchStatus: 'Matched', assignedRole: 'COMPLETED' }).where({ ID: invoice.ID });

    // Auto-Forward: Create Payment Run Task
    const payId = cds.utils.uuid();
    
    await INSERT.into(PaymentRuns).entries({
      ID: payId, paymentRunId: nextId('PAY'), runDate: today(), status: 'DRAFT', assignedRole: 'P2P_FINANCE_MANAGER'
    });
    await INSERT.into(PaymentRunItems).entries({
      ID: cds.utils.uuid(), paymentRun_ID: payId, invoice_ID: invoice.ID, vendor_ID: invoice.vendor_ID, selected: true
    });
    
    return JSON.stringify({ message: "Invoice Verified and Payment Run Task created", currentEntity: "Invoices", currentId: invoice.ID, currentStatus: "VERIFIED", nextEntity: "PaymentRuns", nextId: payId, nextAssignedRole: "P2P_FINANCE_MANAGER", nextWorkflowStage: "PAYMENT_RUN" });
  });

  this.on('executePaymentRun', async (req) => {
    const paymentRun = await SELECT.one.from(PaymentRuns).where({ ID: req.data.paymentRunId });
    await UPDATE(PaymentRuns).set({ status: 'PAYMENT_POSTED', assignedRole: 'COMPLETED' }).where({ ID: paymentRun.ID });
    
    const items = await SELECT.from(PaymentRunItems).where({ paymentRun_ID: paymentRun.ID });
    for (let item of items) {
      await UPDATE(Invoices).set({ status: 'PAID' }).where({ ID: item.invoice_ID });
    }
    return JSON.stringify({ message: "Payment Executed", currentEntity: "PaymentRuns", currentId: paymentRun.ID, currentStatus: "PAYMENT_POSTED", nextAssignedRole: "NONE" });
  });
});
