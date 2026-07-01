using { cuid, managed } from '@sap/cds/common';
using { srini.db.transaction as txn } from './datamodel';

namespace srini.db.transaction;

/**
 * File attachments for purchase orders.
 * `content` is a CAP media stream: uploaded/downloaded as binary via
 * OData (PUT/GET on .../content) and via the custom REST endpoint.
 */
entity attachments : cuid, managed {
  fileName : String(255);
  mimeType : String(128)  @Core.IsMediaType;
  content  : LargeBinary  @Core.MediaType                 : mimeType
                          @Core.ContentDisposition.Filename: fileName;
  fileSize : Integer;
  note     : String(1000);
  po       : Association to txn.purchaseorder;
}
