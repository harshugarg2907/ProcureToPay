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
