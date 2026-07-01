const cds = require('@sap/cds');
const express = require('express');
const multer = require('multer');

// in-memory upload buffer, 10 MB cap
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Custom REST API for the Purchase Order app, mounted at /rest.
 * These are plain JSON/REST endpoints (not OData). The managed approuter
 * enforces authentication before requests reach the app; role-sensitive
 * operations additionally check the caller's roles where req.user is available.
 */
module.exports = function () {
  const router = express.Router();
  router.use(express.json());

  const TXN = 'srini.db.transaction';
  const isAdmin = (req) =>
    !!(req.user && typeof req.user.is === 'function' && req.user.is('PurchaseOrder_Admin'));

  // GET /rest/health — liveness probe
  router.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'PurchaseOrder', ts: new Date().toISOString() });
  });

  // GET /rest/po/summary — order count + gross total grouped by currency
  router.get('/po/summary', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      const { purchaseorder } = db.entities(TXN);
      const rows = await db.run(
        SELECT.from(purchaseorder)
          .columns('CURRENCY as currency', 'count(*) as count', 'sum(GROSS_AMOUNT) as totalGross')
          .groupBy('CURRENCY')
      );
      res.json({ totalOrders: rows.reduce((s, r) => s + Number(r.count || 0), 0), byCurrency: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /rest/po/by-country — order count grouped by the partner's country
  router.get('/po/by-country', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      const { purchaseorder } = db.entities(TXN);
      const rows = await db.run(
        SELECT.from(purchaseorder)
          .columns('PARTNER_GUID.ADDRESS_GUID.COUNTRY as country', 'count(*) as count')
          .groupBy('PARTNER_GUID.ADDRESS_GUID.COUNTRY')
      );
      res.json({ byCountry: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /rest/po/:poId — a single purchase order (header + items) by business PO_ID
  router.get('/po/:poId', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      const { purchaseorder, poitems } = db.entities(TXN);
      const po = await db.run(SELECT.one.from(purchaseorder).where({ PO_ID: req.params.poId }));
      if (!po) return res.status(404).json({ error: `PO ${req.params.poId} not found` });
      const items = await db.run(SELECT.from(poitems).where({ PARENT_KEY_NODE_KEY: po.NODE_KEY }));
      res.json({ ...po, items });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /rest/attachments — upload a file (multipart/form-data, field "file";
  // optional ?poId=<PO_ID> to link it, optional body field "note"). Admin only.
  router.post('/attachments', upload.single('file'), async (req, res) => {
    try {
      if (req.user && !isAdmin(req)) return res.status(403).json({ error: 'administrator role required' });
      if (!req.file) return res.status(400).json({ error: 'no file provided (form field "file")' });
      const db = await cds.connect.to('db');
      const { attachments, purchaseorder } = db.entities(TXN);
      let po_NODE_KEY = null;
      if (req.query.poId) {
        const po = await db.run(SELECT.one.from(purchaseorder).where({ PO_ID: req.query.poId }));
        po_NODE_KEY = po ? po.NODE_KEY : null;
      }
      const ID = cds.utils.uuid();
      await db.run(INSERT.into(attachments).entries({
        ID,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        content: req.file.buffer,
        note: (req.body && req.body.note) || null,
        po_NODE_KEY
      }));
      res.status(201).json({ ID, fileName: req.file.originalname, mimeType: req.file.mimetype, fileSize: req.file.size, linkedPO: req.query.poId || null });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /rest/attachments/:id — download a previously uploaded file
  router.get('/attachments/:id', async (req, res) => {
    try {
      const db = await cds.connect.to('db');
      const { attachments } = db.entities(TXN);
      const row = await db.run(SELECT.one.from(attachments).where({ ID: req.params.id }));
      if (!row || !row.content) return res.status(404).json({ error: 'attachment not found' });
      const buf = Buffer.isBuffer(row.content) ? row.content : Buffer.from(row.content);
      res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${row.fileName || req.params.id}"`);
      res.send(buf);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
