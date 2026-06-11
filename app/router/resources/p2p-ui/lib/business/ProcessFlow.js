sap.ui.define([], function () {
  "use strict";

  return {
    getNextStep: function (currentStatus) {
      const steps = {
        Draft: 'Submit for approval',
        Submitted: 'Approve PR',
        Approved: 'Create RFQ',
        Issued: 'Select vendor',
        'Vendor Selected': 'Create PO',
        Open: 'Approve PO',
        Accepted: 'Post GR',
        Posted: 'Create invoice',
        Matched: 'Create payment advice',
        'Payment Advice Created': 'Execute payment run'
      };
      return steps[currentStatus] || 'Review status';
    }
  };
});
