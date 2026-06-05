const cds = require('@sap/cds');

const today = () => new Date().toISOString().slice(0, 10);
const nextId = (prefix) => `${prefix}-${Date.now().toString().slice(-8)}`;

module.exports = cds.service.impl(async function () {
  const {
    CurrentUser,
    Users,
    UserRoles,
    Vendors,
    Materials,
    PurchaseRequisitions,
    PurchaseRequisitionItems,
    RFQs,
    RFQVendors,
    RFQItems,
    PurchaseOrders,
    PurchaseOrderItems,
    InspectionLots,
    GoodsReceipts,
    GoodsReceiptItems,
    Invoices,
    PaymentRuns,
    PaymentRunItems
  } = this.entities;

  const getUserWithRoles = async (userId) => {
    let user = await SELECT.one.from(Users).where({ userId });
    if (!user) user = await SELECT.one.from(Users).where({ userId: 'viewer' });
    if (!user) return null;

    const roles = await SELECT.from(UserRoles).where({ user_ID: user.ID });
    return {
      ...user,
      roles
    };
  };

  this.on('READ', CurrentUser, async (req) => {
    const userId = req.user.id === 'anonymous' ? 'viewer' : req.user.id;
    const user = await getUserWithRoles(userId);
    if (!user) return req.error(404, 'Current user not found.');
    if (req.query.SELECT.one) return user;

    const result = [user];
    result.$count = 1;
    return result;
  });

  this.before(['CREATE', 'UPDATE'], PurchaseRequisitionItems, (req) => {
    const { quantity, deliveryDate, material_ID, plant } = req.data;
    if (quantity !== undefined && Number(quantity) <= 0) req.error(400, 'Quantity must be greater than zero.');
    if (deliveryDate && deliveryDate < today()) req.error(400, 'Delivery date cannot be in the past.');
    if (!material_ID && req.event === 'CREATE') req.error(400, 'Material is mandatory.');
    if (!plant && req.event === 'CREATE') req.error(400, 'Plant is mandatory.');
  });

  this.before(['CREATE', 'UPDATE'], [PurchaseOrderItems, GoodsReceiptItems], (req) => {
    if (req.data.quantity !== undefined && Number(req.data.quantity) <= 0) {
      req.error(400, 'Quantity must be positive.');
    }
  });

  this.before(['CREATE', 'UPDATE'], [PurchaseOrders, GoodsReceipts, Invoices, PaymentRuns], (req) => {
    for (const field of ['totalNetValue', 'totalGRValue', 'netAmount', 'taxAmount', 'totalPayable', 'totalPaymentAmount']) {
      if (req.data[field] !== undefined && Number(req.data[field]) < 0) req.error(400, 'Amounts must be positive.');
    }
  });

  this.on('getCurrentUser', async (req) => {
    const userId = req.data.userId || req.user.id || 'viewer';
    const user = await getUserWithRoles(userId);
    if (!user) return req.error(404, 'Current user not found.');
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
