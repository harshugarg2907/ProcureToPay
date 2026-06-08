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

  this.on('submitPurchaseRequisition', async (req) => {
    const prId = req.data.prId;
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    const items = await SELECT.from(PurchaseRequisitionItems).where({ requisition_ID: pr.ID });
    if (!items.length) return req.error(400, 'Cannot submit purchase requisition. At least one line item is required.');
    await UPDATE(PurchaseRequisitions).set({ status: 'Submitted', totalItems: items.length }).where({ ID: pr.ID });
    return 'Submitted';
  });

  this.on('approvePurchaseRequisition', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    if (pr.status !== 'Submitted') return req.error(400, 'Cannot approve purchase requisition in current status.');
    await UPDATE(PurchaseRequisitions).set({ status: 'Approved' }).where({ ID: pr.ID });
    return 'Approved';
  });

  this.on('createRFQFromPR', async (req) => {
    const pr = await SELECT.one.from(PurchaseRequisitions).where({ ID: req.data.prId });
    if (!pr) return req.error(404, 'Purchase requisition not found.');
    if (pr.status !== 'Approved') return req.error(400, 'Cannot create RFQ. Purchase requisition is not approved.');
    const prItems = await SELECT.from(PurchaseRequisitionItems).where({ requisition_ID: pr.ID });
    const rfqNo = nextId('RFQ');
    await INSERT.into(RFQs).entries({
      rfqNo,
      sourcePR_ID: pr.ID,
      rfqType: 'AN',
      purchasingOrg: pr.purchasingOrg,
      purchasingGroup: 'P01',
      submissionDeadline: today(),
      status: 'Draft'
    });
    const created = await SELECT.one.from(RFQs).where({ rfqNo });
    if (prItems.length) {
      await INSERT.into(RFQItems).entries(prItems.map((item) => ({
        rfq_ID: created.ID,
        material_ID: item.material_ID,
        description: item.shortText,
        quantity: item.quantity,
        uom: item.uom
      })));
    }
    return 'RFQ Created';
  });

  this.on('issueRFQ', async (req) => {
    const rfq = await SELECT.one.from(RFQs).where({ ID: req.data.rfqId });
    if (!rfq) return req.error(404, 'RFQ not found.');
    const vendors = await SELECT.from(RFQVendors).where({ rfq_ID: rfq.ID });
    if (!vendors.length) return req.error(400, 'Cannot issue RFQ. At least one vendor is required.');
    await UPDATE(RFQVendors).set({ sentStatus: 'Sent' }).where({ rfq_ID: rfq.ID });
    await UPDATE(RFQs).set({ status: 'Issued' }).where({ ID: rfq.ID });
    return 'Issued';
  });

  this.on('createPOFromRFQ', async (req) => {
    const rfq = await SELECT.one.from(RFQs).where({ ID: req.data.rfqId });
    if (!rfq) return req.error(404, 'RFQ not found.');
    if (rfq.status !== 'Vendor Selected') return req.error(400, 'Cannot create PO. RFQ vendor is not selected.');
    const items = await SELECT.from(RFQItems).where({ rfq_ID: rfq.ID });
    const vendor = await SELECT.one.from(Vendors).where({ ID: req.data.vendorId });
    if (!vendor) return req.error(404, 'Vendor not found.');
    const materialsList = await SELECT.from(Materials);
    const materialById = Object.fromEntries(materialsList.map((m) => [m.ID, m]));
    const totalNetValue = items.reduce((sum, item) => {
      const price = Number(materialById[item.material_ID]?.movingAvgPrice || 0);
      return sum + Number(item.quantity || 0) * price;
    }, 0);
    await INSERT.into(PurchaseOrders).entries({
      poNo: nextId('PO'),
      sourceRFQ_ID: rfq.ID,
      vendor_ID: vendor.ID,
      purchasingOrg: rfq.purchasingOrg,
      purchasingGroup: rfq.purchasingGroup,
      companyCode: '1000',
      currency: vendor.currency || 'USD',
      documentDate: today(),
      deliveryDate: today(),
      status: 'Open',
      totalNetValue
    });
    const po = await SELECT.one.from(PurchaseOrders).orderBy('createdAt desc');
    if (items.length) {
      await INSERT.into(PurchaseOrderItems).entries(items.map((item) => {
        const material = materialById[item.material_ID] || {};
        const unitPrice = Number(material.movingAvgPrice || 0);
        return {
          purchaseOrder_ID: po.ID,
          material_ID: item.material_ID,
          quantity: item.quantity,
          unitPrice,
          netValue: Number(item.quantity || 0) * unitPrice,
          deliveryDate: today(),
          plant: material.plant || '1000',
          storageLocation: 'RM01',
          uom: item.uom
        };
      }));
    }
    return 'PO Created';
  });

  this.on('approvePO', async (req) => {
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: req.data.poId });
    if (!po) return req.error(404, 'Purchase order not found.');
    if (po.status !== 'Open') return req.error(400, 'Cannot approve purchase order in current status.');
    await UPDATE(PurchaseOrders).set({ status: 'Approved' }).where({ ID: po.ID });
    return 'Approved';
  });

  this.on('postUsageDecision', async (req) => {
    const lot = await SELECT.one.from(InspectionLots).where({ ID: req.data.lotId });
    if (!lot) return req.error(404, 'Inspection lot not found.');
    if (!lot.usageDecisionCode) return req.error(400, 'Cannot post usage decision. Usage decision is required.');
    const accepted = Number(lot.acceptedQuantity || 0);
    const rejected = Number(lot.rejectedQuantity || 0);
    const lotQty = Number(lot.lotQuantity || 0);
    if (accepted + rejected !== lotQty) return req.error(400, 'Cannot post usage decision. Accepted and rejected quantity must equal lot quantity.');
    const status = accepted === lotQty ? 'Accepted' : rejected === lotQty ? 'Rejected' : 'Partially Accepted';
    await UPDATE(InspectionLots).set({ status }).where({ ID: lot.ID });
    return 'Usage decision posted';
  });

  this.on('postGoodsReceipt', async (req) => {
    const lot = await SELECT.one.from(InspectionLots).where({ ID: req.data.lotId });
    if (!lot) return req.error(404, 'Inspection lot not found.');
    if (!['Accepted', 'Partially Accepted'].includes(lot.status)) return req.error(400, 'Cannot post goods receipt. Inspection lot is not accepted.');
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: lot.purchaseOrder_ID });
    if (!po) return req.error(404, 'Purchase order not found.');
    const grNo = nextId('GR');
    await INSERT.into(GoodsReceipts).entries({
      grNo,
      purchaseOrder_ID: po.ID,
      inspectionLot_ID: lot.ID,
      postingDate: today(),
      documentDate: today(),
      plant: '1000',
      storageLocation: 'RM01',
      batch: nextId('B'),
      totalGRValue: 0,
      status: 'Posted'
    });
    const gr = await SELECT.one.from(GoodsReceipts).orderBy('createdAt desc');
    const lineItems = [];
    if (Number(lot.acceptedQuantity || 0) > 0) {
      lineItems.push({
        goodsReceipt_ID: gr.ID,
        material_ID: lot.material_ID,
        quantity: lot.acceptedQuantity,
        uom: 'EA',
        stockType: 'Unrestricted',
        movementType: '101',
        storageLocation: 'RM01'
      });
    }
    if (Number(lot.rejectedQuantity || 0) > 0) {
      lineItems.push({
        goodsReceipt_ID: gr.ID,
        material_ID: lot.material_ID,
        quantity: lot.rejectedQuantity,
        uom: 'EA',
        stockType: 'Return to Vendor',
        movementType: '122',
        storageLocation: 'RTV1'
      });
    }
    if (lineItems.length) await INSERT.into(GoodsReceiptItems).entries(lineItems);
    const newStatus = Number(lot.acceptedQuantity || 0) === Number(lot.lotQuantity || 0) ? 'Received' : 'Partially Received';
    await UPDATE(PurchaseOrders).set({ status: newStatus }).where({ ID: po.ID });
    return 'Goods receipt posted';
  });

  this.on('runThreeWayMatch', async (req) => {
    const invoice = await SELECT.one.from(Invoices).where({ ID: req.data.invoiceId });
    if (!invoice) return req.error(404, 'Invoice not found.');
    const po = await SELECT.one.from(PurchaseOrders).where({ ID: invoice.purchaseOrder_ID });
    if (!po) return req.error(404, 'Purchase order not found.');
    const matched = Math.abs(Number(invoice.netAmount || 0) - Number(po.totalNetValue || 0)) <= 1;
    const status = matched ? 'Matched' : 'Mismatch';
    await UPDATE(Invoices).set({ matchStatus: status, status }).where({ ID: invoice.ID });
    return status;
  });

  this.on('createPaymentAdvice', async (req) => {
    const invoice = await SELECT.one.from(Invoices).where({ ID: req.data.invoiceId });
    if (!invoice) return req.error(404, 'Invoice not found.');
    if (invoice.matchStatus !== 'Matched') return req.error(400, 'Cannot create payment advice. Invoice is not matched.');
    await UPDATE(Invoices).set({ status: 'Payment Advice Created' }).where({ ID: invoice.ID });
    return 'Payment advice created';
  });

  this.on('executePaymentRun', async (req) => {
    const paymentRun = await SELECT.one.from(PaymentRuns).where({ ID: req.data.paymentRunId });
    if (!paymentRun) return req.error(404, 'Payment run not found.');
    const items = await SELECT.from(PaymentRunItems).where({ paymentRun_ID: paymentRun.ID, selected: true });
    if (!items.length) return req.error(400, 'Cannot execute payment run. No selected payment items found.');
    await UPDATE(PaymentRuns).set({ status: 'Payment Posted' }).where({ ID: paymentRun.ID });
    for (const item of items) {
      await UPDATE(Invoices).set({ status: 'Paid' }).where({ ID: item.invoice_ID });
    }
    return 'Payment run executed';
  });
});
