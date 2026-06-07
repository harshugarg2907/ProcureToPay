using P2PService as service from './p2p-service';

annotate service.CurrentUser with @(
  UI.HeaderInfo: {
    TypeName: 'Current User',
    TypeNamePlural: 'Current Users',
    Title: { Value: fullName },
    Description: { Value: userId }
  },
  UI.SelectionFields: [userId, fullName, companyCode, status],
  UI.LineItem: [
    { Value: userId, Label: 'User ID' },
    { Value: fullName, Label: 'Full Name' },
    { Value: email, Label: 'Email' },
    { Value: companyCode, Label: 'Company Code' },
    { Value: costCenter, Label: 'Cost Center' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { Value: userId, Label: 'User ID' },
    { Value: fullName, Label: 'Full Name' },
    { Value: email, Label: 'Email' },
    { Value: companyCode, Label: 'Company Code' },
    { Value: costCenter, Label: 'Cost Center' },
    { Value: language, Label: 'Language' },
    { Value: status, Label: 'Status' }
  ]
);

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
  ],
  UI.Identification: [
    { Value: poNo, Label: 'PO Number' },
    { Value: purchasingOrg, Label: 'Purchasing Organization' },
    { Value: companyCode, Label: 'Company Code' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.PurchaseRequisitions with @(
  UI.HeaderInfo: {
    TypeName: 'Purchase Requisition',
    TypeNamePlural: 'Purchase Requisitions',
    Title: { Value: prNo },
    Description: { Value: status }
  },
  UI.SelectionFields: [prNo, status, purchasingOrg, requestDate],
  UI.LineItem: [
    { Value: prNo, Label: 'PR Number' },
    { Value: requisitioner, Label: 'Requisitioner' },
    { Value: purchasingOrg, Label: 'Purchasing Org' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.RFQs with @(
  UI.HeaderInfo: {
    TypeName: 'RFQ',
    TypeNamePlural: 'RFQs',
    Title: { Value: rfqNo },
    Description: { Value: status }
  },
  UI.SelectionFields: [rfqNo, status, purchasingOrg, submissionDeadline],
  UI.LineItem: [
    { Value: rfqNo, Label: 'RFQ Number' },
    { Value: sourcePR.prNo, Label: 'Source PR' },
    { Value: purchasingOrg, Label: 'Purchasing Org' },
    { Value: submissionDeadline, Label: 'Submission Deadline' },
    { Value: selectedVendor.name, Label: 'Selected Vendor' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { Value: rfqNo, Label: 'RFQ Number' },
    { Value: purchasingOrg, Label: 'Purchasing Organization' },
    { Value: purchasingGroup, Label: 'Purchasing Group' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.Vendors with @(
  UI.HeaderInfo: {
    TypeName: 'Vendor',
    TypeNamePlural: 'Vendors',
    Title: { Value: name },
    Description: { Value: vendorNo }
  },
  UI.SelectionFields: [vendorNo, name, city, currency],
  UI.LineItem: [
    { Value: vendorNo, Label: 'Vendor' },
    { Value: name, Label: 'Name' },
    { Value: city, Label: 'City' },
    { Value: paymentTerms, Label: 'Payment Terms' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.Materials with @(
  UI.HeaderInfo: {
    TypeName: 'Material',
    TypeNamePlural: 'Materials',
    Title: { Value: materialNo },
    Description: { Value: description }
  },
  UI.SelectionFields: [materialNo, materialGroup, plant, status],
  UI.LineItem: [
    { Value: materialNo, Label: 'Material' },
    { Value: description, Label: 'Description' },
    { Value: baseUom, Label: 'UoM' },
    { Value: movingAvgPrice, Label: 'Price' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.InspectionLots with @(
  UI.HeaderInfo: {
    TypeName: 'Inspection Lot',
    TypeNamePlural: 'Inspection Lots',
    Title: { Value: inspectionLotNo },
    Description: { Value: status }
  },
  UI.SelectionFields: [inspectionLotNo, status, inspectionType, vendor_ID],
  UI.LineItem: [
    { Value: inspectionLotNo, Label: 'Inspection Lot' },
    { Value: material.materialNo, Label: 'Material' },
    { Value: vendor.name, Label: 'Vendor' },
    { Value: lotQuantity, Label: 'Lot Quantity' },
    { Value: acceptedQuantity, Label: 'Accepted' },
    { Value: rejectedQuantity, Label: 'Rejected' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { Value: inspectionLotNo, Label: 'Inspection Lot' },
    { Value: inspectionType, Label: 'Inspection Type' },
    { Value: usageDecisionCode, Label: 'Usage Decision' },
    { Value: rejectionReason, Label: 'Rejection Reason' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.GoodsReceipts with @(
  UI.HeaderInfo: {
    TypeName: 'Goods Receipt',
    TypeNamePlural: 'Goods Receipts',
    Title: { Value: grNo },
    Description: { Value: status }
  },
  UI.SelectionFields: [grNo, status, postingDate, plant],
  UI.LineItem: [
    { Value: grNo, Label: 'GR Number' },
    { Value: purchaseOrder.poNo, Label: 'Purchase Order' },
    { Value: inspectionLot.inspectionLotNo, Label: 'Inspection Lot' },
    { Value: postingDate, Label: 'Posting Date' },
    { Value: plant, Label: 'Plant' },
    { Value: totalGRValue, Label: 'GR Value' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { Value: grNo, Label: 'GR Number' },
    { Value: documentDate, Label: 'Document Date' },
    { Value: storageLocation, Label: 'Storage Location' },
    { Value: batch, Label: 'Batch' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.Invoices with @(
  UI.HeaderInfo: {
    TypeName: 'Invoice',
    TypeNamePlural: 'Invoices',
    Title: { Value: invoiceNo },
    Description: { Value: status }
  },
  UI.SelectionFields: [invoiceNo, status, matchStatus, dueDate],
  UI.LineItem: [
    { Value: invoiceNo, Label: 'Invoice Number' },
    { Value: vendor.name, Label: 'Vendor' },
    { Value: purchaseOrder.poNo, Label: 'Purchase Order' },
    { Value: invoiceDate, Label: 'Invoice Date' },
    { Value: totalPayable, Label: 'Total Payable' },
    { Value: matchStatus, Label: 'Match Status' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { Value: invoiceNo, Label: 'Invoice Number' },
    { Value: invoiceReference, Label: 'Reference' },
    { Value: postingDate, Label: 'Posting Date' },
    { Value: dueDate, Label: 'Due Date' },
    { Value: paymentTerms, Label: 'Payment Terms' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.PaymentRuns with @(
  UI.HeaderInfo: {
    TypeName: 'Payment Run',
    TypeNamePlural: 'Payment Runs',
    Title: { Value: paymentRunId },
    Description: { Value: status }
  },
  UI.SelectionFields: [paymentRunId, status, runDate, companyCode],
  UI.LineItem: [
    { Value: paymentRunId, Label: 'Payment Run' },
    { Value: runDate, Label: 'Run Date' },
    { Value: companyCode, Label: 'Company Code' },
    { Value: paymentMethod, Label: 'Payment Method' },
    { Value: nextPaymentDate, Label: 'Next Payment Date' },
    { Value: totalPaymentAmount, Label: 'Total Amount' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { Value: paymentRunId, Label: 'Payment Run' },
    { Value: runDate, Label: 'Run Date' },
    { Value: companyCode, Label: 'Company Code' },
    { Value: paymentMethod, Label: 'Payment Method' },
    { Value: status, Label: 'Status' }
  ]
);

annotate service.POStatusAnalytics with @(
  UI.Chart: {
    Title: 'Purchase Orders by Status',
    ChartType: #Donut,
    Dimensions: [status],
    Measures: [total]
  }
);

annotate service.VendorSpendAnalytics with @(
  UI.Chart: {
    Title: 'Spend by Vendor',
    ChartType: #Bar,
    Dimensions: [vendorName],
    Measures: [totalSpend]
  }
);
