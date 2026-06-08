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
    await UPDATE(PurchaseRequisitions).set({ status: 'PENDING_APPROVAL' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'PENDING_APPROVAL', 'Submit PR', req.user && req.user.id, 'Submitted to Procurement');
    return JSON.stringify({ message: "PR Submitted", entity: "PurchaseRequisitions", id: pr.ID, status: "PENDING_APPROVAL" });
  });

  this.on('approvePurchaseRequisition', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    if (pr.status !== 'PENDING_APPROVAL') return req.error(400, 'PR is not pending approval.');
    await UPDATE(PurchaseRequisitions).set({ status: 'APPROVED' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'APPROVED', 'Approve PR', req.user && req.user.id, req.data.comments || 'PR Approved');
    return JSON.stringify({ message: "PR Approved", entity: "PurchaseRequisitions", id: pr.ID, status: "APPROVED" });
  });

  this.on('rejectPurchaseRequisition', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    await UPDATE(PurchaseRequisitions).set({ status: 'REJECTED' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'REJECTED', 'Reject PR', req.user && req.user.id, req.data.comments);
    return JSON.stringify({ message: "PR Rejected", entity: "PurchaseRequisitions", id: pr.ID, status: "REJECTED" });
  });
  
  this.on('createOrGetRFQFromPR', async (req) => {
    const { prId } = req.data;
    const existingRFQ = await SELECT.one.from(RFQs).where({ sourcePR_ID: prId });
    if (existingRFQ) return JSON.stringify({ message: "RFQ exists.", entity: "RFQs", id: existingRFQ.ID, status: existingRFQ.status });

    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: prId });
    const items = await SELECT.from(PurchaseRequisitionItems).where({ requisition_ID: prId });
    const rfqId = cds.utils.uuid();
    
    await INSERT.into(RFQs).entries({
      ID: rfqId, rfqNo: nextId('RFQ'), sourcePR_ID: prId, status: 'DRAFT', 
      purchasingOrg: pr.purchasingOrg, submissionDeadline: today()
    });
    if (items.length > 0) {
      await INSERT.into(RFQItems).entries(items.map(item => ({
        ID: cds.utils.uuid(), rfq_ID: rfqId, material_ID: item.material_ID, quantity: item.quantity, uom: item.uom, description: item.shortText
      })));
    }
    await UPDATE(PurchaseRequisitions).set({ status: 'RFQ_CREATED' }).where({ ID: prId });
    return JSON.stringify({ message: "RFQ Created", entity: "RFQs", id: rfqId, status: "DRAFT" });
  });

  this.on('addVendorToRFQ', async (req) => {
    const { rfqId, vendorId } = req.data;
    await INSERT.into(RFQVendors).entries({
      ID: cds.utils.uuid(), rfq_ID: rfqId, vendor_ID: vendorId, sentStatus: 'Pending', responseStatus: 'Pending', quotedAmount: 0
    });
    await UPDATE(RFQs).set({ status: 'VENDORS_ASSIGNED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "Vendor Added", entity: "RFQs", id: rfqId, status: "VENDORS_ASSIGNED" });
  });

  this.on('issueRFQ', async (req) => {
    const { rfqId } = req.data;
    await UPDATE(RFQVendors).set({ sentStatus: 'Sent' }).where({ rfq_ID: rfqId });
    await UPDATE(RFQs).set({ status: 'ISSUED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "RFQ Issued", entity: "RFQs", id: rfqId, status: "ISSUED" });
  });

  this.on('receiveQuotation', async (req) => {
    const { rfqId, vendorId, quotedAmount, leadTime, remarks } = req.data;
    await UPDATE(RFQVendors).set({ quotedAmount, leadTime, remarks, responseStatus: 'RECEIVED' }).where({ rfq_ID: rfqId, vendor_ID: vendorId });
    await UPDATE(RFQs).set({ status: 'QUOTATIONS_RECEIVED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "Quotation Received", entity: "RFQs", id: rfqId, status: "QUOTATIONS_RECEIVED" });
  });

  this.on('selectVendor', async (req) => {
    const { rfqId, vendorId } = req.data;
    await UPDATE(RFQs).set({ selectedVendor_ID: vendorId, status: 'VENDOR_SELECTED' }).where({ ID: rfqId });
    return JSON.stringify({ message: "Vendor Selected", entity: "RFQs", id: rfqId, status: "VENDOR_SELECTED" });
  });

  this.on('createOrGetPOFromRFQ', async (req) => {
    const { rfqId, deliveryDate, currency, companyCode, purchasingOrg, purchasingGroup } = req.data;
    const existingPO = await SELECT.one.from(PurchaseOrders).where({ sourceRFQ_ID: rfqId });
    if (existingPO) return JSON.stringify({ message: "PO exists.", entity: "PurchaseOrders", id: existingPO.ID, status: existingPO.status });

    const rfq = await SELECT.one.from(RFQs).where({ ID: rfqId });
    const items = await SELECT.from(RFQItems).where({ rfq_ID: rfqId });
    const quotes = await SELECT.one.from(RFQVendors).where({ rfq_ID: rfqId, vendor_ID: rfq.selectedVendor_ID });
    const poId = cds.utils.uuid();

    await INSERT.into(PurchaseOrders).entries({
      ID: poId, poNo: nextId('PO'), sourceRFQ_ID: rfqId, vendor_ID: rfq.selectedVendor_ID, status: 'DRAFT', 
      currency: currency || 'USD', documentDate: today(), deliveryDate: deliveryDate || today(), companyCode, purchasingOrg, purchasingGroup, totalNetValue: quotes ? quotes.quotedAmount : 0
    });
    if (items.length > 0) {
      await INSERT.into(PurchaseOrderItems).entries(items.map(item => ({
        ID: cds.utils.uuid(), purchaseOrder_ID: poId, material_ID: item.material_ID, quantity: item.quantity, uom: item.uom
      })));
    }
    return JSON.stringify({ message: "PO Created", entity: "PurchaseOrders", id: poId, status: "DRAFT" });
  });

  this.on('submitPO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    await UPDATE(PurchaseOrders).set({ status: 'PENDING_APPROVAL' }).where({ ID: po.ID });
    return JSON.stringify({ message: "PO Submitted", entity: "PurchaseOrders", id: po.ID, status: "PENDING_APPROVAL" });
  });

  this.on('approvePO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    await UPDATE(PurchaseOrders).set({ status: 'APPROVED' }).where({ ID: po.ID });
    await logHistory('PurchaseOrders', po.ID, po.status, 'APPROVED', 'Approve PO', req.user && req.user.id, req.data.comments);
    return JSON.stringify({ message: "PO Approved", entity: "PurchaseOrders", id: po.ID, status: "APPROVED" });
  });
  
  this.on('rejectPO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    await UPDATE(PurchaseOrders).set({ status: 'REJECTED' }).where({ ID: po.ID });
    return JSON.stringify({ message: "PO Rejected", entity: "PurchaseOrders", id: po.ID, status: "REJECTED" });
  });

  this.on('postGoodsReceipt', async (req) => {
    const { poId, postingDate, documentDate, plant, storageLocation, batch, receivedQuantity } = req.data;
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: poId });
    const existingGR = await SELECT.one.from(GoodsReceipts).where({ purchaseOrder_ID: poId });
    if (existingGR) return JSON.stringify({ message: "GR exists.", entity: "GoodsReceipts", id: existingGR.ID, status: existingGR.status });

    const grId = cds.utils.uuid();
    await INSERT.into(GoodsReceipts).entries({
      ID: grId, grNo: nextId('GR'), purchaseOrder_ID: po.ID, 
      postingDate: postingDate || today(), documentDate: documentDate || today(), 
      plant: plant || '1000', storageLocation: storageLocation || 'RM01', batch, totalGRValue: po.totalNetValue || 0, status: 'POSTED'
    });
    
    await UPDATE(PurchaseOrders).set({ status: 'GR_POSTED' }).where({ ID: po.ID });
    return JSON.stringify({ message: "GR Posted", entity: "GoodsReceipts", id: grId, status: "POSTED" });
  });

  this.on('createOrGetInspectionLotFromGR', async (req) => {
    const { grId } = req.data;
    const gr = await SELECT.one.from(GoodsReceipts).where({ ID: grId });
    if (gr.inspectionLot_ID) return JSON.stringify({ message: "QC exists.", entity: "InspectionLots", id: gr.inspectionLot_ID, status: "OPEN" });

    const po = await SELECT.one.from(PurchaseOrders).where({ ID: gr.purchaseOrder_ID });
    const lotId = cds.utils.uuid();
    await INSERT.into(InspectionLots).entries({
      ID: lotId, inspectionLotNo: nextId('LOT'), purchaseOrder_ID: po.ID, vendor_ID: po.vendor_ID, status: 'OPEN'
    });
    await UPDATE(GoodsReceipts).set({ inspectionLot_ID: lotId }).where({ ID: grId });
    return JSON.stringify({ message: "QC Created", entity: "InspectionLots", id: lotId, status: "OPEN" });
  });

  this.on('postUsageDecision', async (req) => {
    const { lotId, acceptedQuantity, rejectedQuantity, usageDecisionCode } = req.data;
    const lot = await SELECT.one.from(InspectionLots).where({ ID: lotId });
    
    const status = (rejectedQuantity > 0) ? 'FAILED' : 'PASSED';
    await UPDATE(InspectionLots).set({ acceptedQuantity, rejectedQuantity, usageDecisionCode, status }).where({ ID: lot.ID });
    return JSON.stringify({ message: "QC Completed", entity: "InspectionLots", id: lot.ID, status });
  });

  this.on('createOrGetInvoiceFromQC', async (req) => {
    const { lotId, invoiceRef, taxAmount, dueDate } = req.data;
    const lot = await SELECT.one.from(InspectionLots).where({ ID: lotId });
    const gr = await SELECT.one.from(GoodsReceipts).where({ inspectionLot_ID: lotId });
    const existingInv = await SELECT.one.from(Invoices).where({ goodsReceipt_ID: gr.ID });
    if (existingInv) return JSON.stringify({ message: "Invoice exists.", entity: "Invoices", id: existingInv.ID, status: existingInv.status });

    const po = await SELECT.one.from(PurchaseOrders).where({ ID: lot.purchaseOrder_ID });
    const invId = cds.utils.uuid();
    await INSERT.into(Invoices).entries({
      ID: invId, invoiceNo: nextId('INV'), goodsReceipt_ID: gr.ID, purchaseOrder_ID: po.ID, vendor_ID: po.vendor_ID,
      invoiceReference: invoiceRef, taxAmount: taxAmount || 0, netAmount: po.totalNetValue || 0, 
      totalPayable: (Number(po.totalNetValue || 0) + Number(taxAmount || 0)), dueDate, status: 'CREATED', matchStatus: 'Pending'
    });
    return JSON.stringify({ message: "Invoice Created", entity: "Invoices", id: invId, status: "CREATED" });
  });

  this.on('verifyInvoice', async (req) => {
    const invoice = await SELECT.one.from(Invoices).where({ ID: req.data.invoiceId });
    await UPDATE(Invoices).set({ status: 'VERIFIED', matchStatus: 'Matched' }).where({ ID: invoice.ID });
    return JSON.stringify({ message: "Invoice Verified", entity: "Invoices", id: invoice.ID, status: "VERIFIED" });
  });

  this.on('createOrGetPaymentRunFromInvoice', async (req) => {
    const { invoiceId, paymentMethod, paymentDate } = req.data;
    const existingPay = await SELECT.one.from(PaymentRunItems).where({ invoice_ID: invoiceId });
    if (existingPay) return JSON.stringify({ message: "Payment Run exists.", entity: "PaymentRuns", id: existingPay.paymentRun_ID, status: "CREATED" });
    
    const invoice = await SELECT.one.from(Invoices).where({ ID: invoiceId });
    const payId = cds.utils.uuid();
    
    await INSERT.into(PaymentRuns).entries({
      ID: payId, paymentRunId: nextId('PAY'), runDate: today(), nextPaymentDate: paymentDate || today(), paymentMethod,
      totalPaymentAmount: invoice.totalPayable, status: 'CREATED'
    });
    await INSERT.into(PaymentRunItems).entries({
      ID: cds.utils.uuid(), paymentRun_ID: payId, invoice_ID: invoice.ID, vendor_ID: invoice.vendor_ID, netPayment: invoice.totalPayable, selected: true
    });
    
    await UPDATE(Invoices).set({ status: 'PAYMENT_PENDING' }).where({ ID: invoice.ID });
    return JSON.stringify({ message: "Payment Run Created", entity: "PaymentRuns", id: payId, status: "CREATED" });
  });

  this.on('executePaymentRun', async (req) => {
    const paymentRun = await SELECT.one.from(PaymentRuns).where({ ID: req.data.paymentRunId });
    await UPDATE(PaymentRuns).set({ status: 'PAYMENT_POSTED' }).where({ ID: paymentRun.ID });
    
    const items = await SELECT.from(PaymentRunItems).where({ paymentRun_ID: paymentRun.ID });
    for (let item of items) {
      await UPDATE(Invoices).set({ status: 'PAID' }).where({ ID: item.invoice_ID });
    }
    return JSON.stringify({ message: "Payment Executed", entity: "PaymentRuns", id: paymentRun.ID, status: "PAYMENT_POSTED" });
  });
});
