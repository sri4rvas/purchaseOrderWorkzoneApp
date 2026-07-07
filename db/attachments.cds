using { Attachments } from '@cap-js/attachments';
using from './datamodel';

// Attachments for purchase orders, provided by the @cap-js/attachments plugin.
// The plugin renders an "Attachments" facet with Upload/Download on the object page.
extend srini.db.transaction.purchaseorder with {
  attachments : Composition of many Attachments;
}
