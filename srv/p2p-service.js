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
    await UPDATE(PurchaseRequisitions).set({ status: 'PENDING_APPROVAL' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'PENDING_APPROVAL', 'Submit PR', req.user && req.user.id, 'Submitted to Procurement');
    return 'Submitted';
  });

  this.on('approvePurchaseRequisition', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    
    await UPDATE(PurchaseRequisitions).set({ status: 'APPROVED' }).where({ ID: pr.ID });
    await logHistory('PurchaseRequisitions', pr.ID, pr.status, 'APPROVED', 'Approve PR', req.user && req.user.id, 'PR Approved');

    // Auto-create PO Draft (Bypass manual RFQ)
    const poNo = nextId('PO');
    await INSERT.into(PurchaseOrders).entries({
      poNo, status: 'DRAFT', documentDate: today(), deliveryDate: today(), purchasingOrg: pr.purchasingOrg
    });
    
    return 'Approved';
  });

  // Legacy actions mapped to workflow logic
  this.on('createRFQFromPR', async (req) => 'RFQ bypassed in automated workflow');
  this.on('issueRFQ', async (req) => 'RFQ bypassed in automated workflow');
  
  this.on('createPOFromRFQ', async (req) => {
    // Treated as Submit PO logic if the UI invokes this endpoint to move PO forward
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.rfqId || req.data.poId });
    if (!po) return req.error(404, 'Purchase order not found.');
    await UPDATE(PurchaseOrders).set({ status: 'PENDING_APPROVAL' }).where({ ID: po.ID });
    await logHistory('PurchaseOrders', po.ID, po.status, 'PENDING_APPROVAL', 'Submit PO', req.user && req.user.id, 'PO submitted for approval');
    return 'PO Created / Submitted';
  });

  this.on('approvePO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    if (!po) return req.error(404, 'Purchase order not found.');
    
    await UPDATE(PurchaseOrders).set({ status: 'APPROVED' }).where({ ID: po.ID });
    await logHistory('PurchaseOrders', po.ID, po.status, 'APPROVED', 'Approve PO', req.user && req.user.id, 'PO Approved');

    // Auto-create Goods Receipt Task
    const grNo = nextId('GR');
    await INSERT.into(GoodsReceipts).entries({
      grNo, status: 'DRAFT', postingDate: today(), documentDate: today()
    });

    return 'Approved';
  });

  this.on('postGoodsReceipt', async (req) => {
    const grId = req.data.lotId || req.data.grId;
    const grData = await SELECT.one.from(GoodsReceipts).where({ ID: grId });
    if (!grData) return req.error(404, 'Goods Receipt not found.');
    
    await UPDATE(GoodsReceipts).set({ status: 'POSTED' }).where({ ID: grData.ID });
    await logHistory('GoodsReceipts', grData.ID, grData.status, 'POSTED', 'Post GR', req.user && req.user.id, 'GR Posted');

    // Auto-create QC Inspection Task
    const lotNo = nextId('LOT');
    await INSERT.into(InspectionLots).entries({
      inspectionLotNo: lotNo, status: 'DRAFT', inspectionType: 'Quality'
    });

    return 'Goods receipt posted';
  });

  this.on('postUsageDecision', async (req) => {
    const lot = await SELECT.one.from(InspectionLots).where({ ID: req.data.lotId });
    if (!lot) return req.error(404, 'Inspection lot not found.');
    
    await UPDATE(InspectionLots).set({ status: 'PASSED' }).where({ ID: lot.ID });
    await logHistory('InspectionLots', lot.ID, lot.status, 'PASSED', 'Pass QC', req.user && req.user.id, 'QC Passed');

    // Auto-create Invoice Verification task
    const invNo = nextId('INV');
    await INSERT.into(Invoices).entries({
      invoiceNo: invNo, status: 'DRAFT', invoiceDate: today(), matchStatus: 'Pending'
    });

    return 'Usage decision posted';
  });

  this.on('runThreeWayMatch', async (req) => {
    const invoice = await SELECT.one.from(Invoices).where({ ID: req.data.invoiceId });
    if (!invoice) return req.error(404, 'Invoice not found.');
    
    await UPDATE(Invoices).set({ status: 'VERIFIED', matchStatus: 'Matched' }).where({ ID: invoice.ID });
    await logHistory('Invoices', invoice.ID, invoice.status, 'VERIFIED', 'Verify Invoice', req.user && req.user.id, 'Invoice Verified');

    // Auto-create Payment Approval Task
    const payNo = nextId('PAY');
    await INSERT.into(PaymentRuns).entries({
      paymentRunId: payNo, status: 'PENDING_APPROVAL', runDate: today()
    });

    return 'Matched';
  });

  this.on('createPaymentAdvice', async (req) => {
    const invoice = await SELECT.one.from(Invoices).where({ ID: req.data.invoiceId });
    if (!invoice) return req.error(404, 'Invoice not found.');
    
    await UPDATE(Invoices).set({ status: 'PAYMENT_APPROVED' }).where({ ID: invoice.ID });
    await logHistory('Invoices', invoice.ID, invoice.status, 'PAYMENT_APPROVED', 'Approve Payment', req.user && req.user.id, 'Payment Approved');
    return 'Payment advice created';
  });

  this.on('executePaymentRun', async (req) => {
    const paymentRun = await SELECT.one.from(PaymentRuns).where({ ID: req.data.paymentRunId });
    if (!paymentRun) return req.error(404, 'Payment run not found.');
    
    await UPDATE(PaymentRuns).set({ status: 'COMPLETED' }).where({ ID: paymentRun.ID });
    await logHistory('PaymentRuns', paymentRun.ID, paymentRun.status, 'COMPLETED', 'Execute Payment', req.user && req.user.id, 'Payment Completed');
    return 'Payment run executed';
  });
});
