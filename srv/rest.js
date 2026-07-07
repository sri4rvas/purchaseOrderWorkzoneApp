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




  return router;
};
