# Purchase Order App — Work Zone Migration & Architecture

This project (`atcapm`) was originally a CAP service + Fiori Elements UI served by a
**standalone approuter** (the old `test-ui` Node.js module). It now runs behind the
**SAP-managed approuter** of **SAP Build Work Zone (Standard Edition)**, with role-based
data restrictions and an expanded multi-currency dataset.

This document reflects the **final state** after all corrections. Companion notes:
`FIX_NODE_VERSION.md`, `FIX_CODE1001.md`, `PARTNER_RESTRICTION.md`.

---

## 1. Final architecture (MTA)

**Modules**
| Module | Type | Role |
|--------|------|------|
| `PurchaseOrder-srv` | nodejs | CAP OData V4 backend; provides `srv-api` (`srv-url`) |
| `hdi_PurchaseOrder_db-deployer` | hdb | HANA HDI content deployer |
| `purchaseorderapp` | html5 | Fiori Elements UI, uploaded to the HTML5 App Repository |
| `PurchaseOrder-app-content` | com.sap.application.content | Uploads the built UI to the `app-host` |
| `PurchaseOrder-destination-content` | com.sap.application.content | Creates the sub-account destinations Work Zone needs |

**Resources**
| Resource | Service | Role |
|----------|---------|------|
| `hdi_PurchaseOrder_db` | hana / hdi-shared | Database container |
| `PurchaseOrder-xsuaa` | xsuaa / application | Auth (xsappname **`PurchaseOrder`**) |
| `PurchaseOrder-html5-repo-host` | html5-apps-repo / app-host | Stores the UI app |
| `PurchaseOrder-destination-service` | destination / lite | Holds the `ui5` destination + HTML5 runtime |

The standalone approuter files (`app/package.json`, `app/package-lock.json`,
`app/xs-app.json`) were removed. The Fiori inbound (`semanticObject: purchaseOrder`,
`action: manage`) and `sap.cloud.service: purchaseorder.service` are in `manifest.json`.

---

## 2. Build pipeline (important – encodes several fixes)

`mta.yaml` `before-all`:
```yaml
- npx cds build --production
- node fix-engines.js          # re-pins gen/db + gen/srv engines to ^20 || ^22
```

UI build (`app/purchaseorderapp`): `ui5-deploy.yaml` runs **`ui5-task-zipper`** (dev
dependency `ui5-task-zipper`) after the cachebuster task, producing
`dist/purchaseorderapp.zip` with all resources at the zip root (`relativePaths: true`).
The html5 module therefore uses `build-result: dist/purchaseorderapp.zip` (not `dist`)
so mbt ships that zip directly instead of re-zipping the folder.
```yaml
commands:
  - npm install --include=dev   # forces @ui5/cli + ui5-task-zipper even under NODE_ENV=production
  - npm run build:cf            # ui5 build + ui5-task-zipper -> dist/purchaseorderapp.zip
```

Runtime stack upgraded to **CAP CDS 9** (`@sap/cds ^9.9.1`, `@sap/cds-dk ^9`), `@cap-js/hana ^2` (replaces `@sap/cds-hana`/`hdb`), `@sap/xssec ^4`, `@sap/xsenv ^6`, `express ^5`. CDS 9 requires **Node ≥ 20**, so root `package.json` pins `"engines": { "node": "^20 || ^22" }` and `fix-engines.js` re-pins the generated deployers to the same range (the CF buildpack then selects Node 22).

These three things together prevent the empty-`data.zip` / `CODE 1001` and the
`BuildpackCompileFailed` / `Unable to install node` staging errors (see §6).

---

## 3. Security model (`xs-security.json` + `CatalogService.cds`)

**Scopes:** `PurchaseOrder_Admin`, `Employee_Viewer`, `PurchaseOrder_CompanyViewer`, `PurchaseOrder_CountryViewer`
**Attributes:** `BankName`, `PARTNER_GUID_NODE_KEY`, `Country`

Three independent restriction dimensions, plus a wide-access admin:

| Dimension | Scope | Attribute | Example role templates → role collections |
|-----------|-------|-----------|-------------------------------------------|
| Admin (wide) | `PurchaseOrder_Admin` | — | `PurchaseOrder_Admin` (assign directly) |
| Employee by bank | `Employee_Viewer` | `BankName` | `Employee_Viewer_SanFrancisco`, `Employee_Viewer_London` |
| PO by company (partner) | `PurchaseOrder_CompanyViewer` | `PARTNER_GUID_NODE_KEY` | `PurchaseOrder_Company_TokyoTech` (B0…0001), `PurchaseOrder_Company_London` (B0…0002) |
| PO by country | `PurchaseOrder_CountryViewer` | `Country` | `PurchaseOrder_from_US` (United States), `PurchaseOrder_from_India` (India) |

Fixed attribute values are baked in with `default-values`, so those role collections are
ready to assign with no manual attribute typing. The generic templates
(`Employee_Viewer`, `PurchaseOrder_CompanyViewer`, `PurchaseOrder_CountryViewer`) leave the
attribute for an administrator to set per role.

**Service-layer `@restrict`** (`srv/CatalogService.cds`):
- `EmployeeSet` — READ → `Employee_Viewer` filtered by `bankName = $user.BankName`;
  WRITE → `PurchaseOrder_Admin`.
- `PurchaseOrder` / `PurchaseOrderItems`:
  - `PurchaseOrder_Admin` → `['*']` (wide access)
  - `PurchaseOrder_CompanyViewer` → READ where `PARTNER_GUID.NODE_KEY = $user.PARTNER_GUID_NODE_KEY`
  - `PurchaseOrder_CountryViewer` → READ where `PARTNER_GUID.ADDRESS_GUID.COUNTRY = $user.Country`
  - (items use the same filters via `PARENT_KEY.…`)

Partner GUID → company values for `PARTNER_GUID_NODE_KEY` are listed in `PARTNER_RESTRICTION.md`.
Country values are the full names stored in `address.COUNTRY` (e.g. `United States`, `India`).

## 4. Backend reachability for Work Zone (IAS-aware)

The UI's `app/purchaseorderapp/webapp/xs-app.json` routes `/CatalogService` to the
**`srv-api`** destination. That destination is created by `PurchaseOrder-destination-content`
and **exchanges the user token** so the audience matches the CAP backend's XSUAA:

```yaml
- Name: srv-api
  URL: ~{srv-api/srv-url}
  Authentication: OAuth2UserTokenExchange       # NOT raw ForwardAuthToken
  ServiceInstanceName: PurchaseOrder-xsuaa
  ServiceKeyName: PurchaseOrder-xsuaa-key
  HTML5.DynamicDestination: true
  sap.cloud.service: purchaseorder.service
```

This is required because the subaccount logs in via **IAS**: a raw IAS token has the wrong
audience for `sb-PurchaseOrder!t...` and the backend rejects it (401 `WrongAudienceError`).
The token exchange re-mints it as an XSUAA token of the backend. `PurchaseOrder_uaa`
(also OAuth2UserTokenExchange) and the `sap.cloud.service` tag tie the app, UAA, and
backend together.

---

## 5. Build & deploy

```bash
unset NODE_ENV
rm -rf gen resources mta_archives node_modules \
       app/purchaseorderapp/node_modules app/purchaseorderapp/dist
npm install
mbt build -p=cf                       # -> mta_archives/atcapm_1.0.0.mtar
cf deploy mta_archives/PurchaseOrder_1.0.0.mtar
```
> The `.mtar` is named after the MTA **ID** (`atcapm`), not the xsappname. `cf undeploy`
> also takes `atcapm`.

Sub-account prerequisites: **HANA Cloud (hdi-shared)**, **SAP Build Work Zone**,
**Destination** and **HTML5 Application Repository** entitled. Adjust the `redirect-uris`
region in `xs-security.json` if not on `us10`.

**Surface in Work Zone:** Cockpit → HTML5 Applications (confirm `purchaseorderapp`) →
Work Zone admin → Content Manager → Content Explorer (refresh HTML5 Apps) → add to a
Group + Role → build a Site → assign the site role. Then assign users the relevant
`PurchaseOrder_*` role collection and **re-login** (incognito) so a fresh token is minted.

---

## 6. Fixes applied during bring-up (history)

| Symptom | Cause | Fix |
|---------|-------|-----|
| `CODE 1001 – could not find applications` (empty `data.zip`) | UI build skipped (`@ui5/cli` not installed under `NODE_ENV=production`) | `npm install --include=dev` in the html5 module; verified `ui5-deploy.yaml` builds a valid `dist` |
| `Unable to install node: no match for ^16 \|\| ^18 \|\| ^20` | CF buildpack ships only Node 22/24; CDS stamps an old engines range into `gen/srv` | root `engines` (now `^20 \|\| ^22` for CDS 9) propagates to `gen/srv` |
| `BuildpackCompileFailed` on `hdi_…_db-deployer` | `gen/db/package.json` keeps its own old engines (not inherited) | `fix-engines.js` re-pins `gen/db` (+`gen/srv`) to `^20 || ^22` after `cds build` |
| Work Zone `Could not load metadata: 500` | Backend destination wasn't resolvable by the managed approuter | explicit `srv-api` sub-account destination |
| Work Zone `404 … route does not exist` | Backend app stopped/route changed (trial auto-stop) | `cf start PurchaseOrder-srv` / redeploy |
| Work Zone `401 WrongAudienceError` (IAS token) | `srv-api` forwarded the raw IAS token | `srv-api` switched to **OAuth2UserTokenExchange** via `PurchaseOrder-xsuaa` (§4) |

---

## 7. Expanded data & local testing

`db/csv/` holds a fully relationally-consistent, multi-currency dataset
(AUD, CAD, CNY, EUR, GBP, INR, JPY, USD): 15 business partners (incl. 5 US, 4 India),
19 products + texts, 10 employees, 29 purchase orders, 79 PO items. Relations:
address ← partner, partner ← product.supplier, partner ← PO.partner, PO ← poitem.parent,
product ← poitem.product, product = product_texts.

`cds watch` mock users (`package.json`, password `myPassword`):

| User | Role | Sees |
|------|------|------|
| `srini` | PurchaseOrder_Admin, Employee_Viewer | everything |
| `srisow` | Employee_Viewer | employees of My Bank of New York |
| `sf_viewer` | Employee_Viewer | employees of My Bank of San Francisco |
| `ldn_viewer` | Employee_Viewer | employees of My Bank of London |
| `company_tokyo` | PurchaseOrder_CompanyViewer | only Tokyo Tech KK POs (JPY) |
| `company_london` | PurchaseOrder_CompanyViewer | only London Components POs (GBP) |
| `country_us` | PurchaseOrder_CountryViewer | all POs of US companies |
| `country_india` | PurchaseOrder_CountryViewer | all POs of India companies |

---

## 8. CDS 9 modernization & cleanup

Applied alongside the CDS 9 / Express 5 upgrade, following current CAP guidelines:

- **OData V2 adapter as a cds-plugin.** `@cap-js-community/odata-v2-adapter` auto-registers
  as a plugin in CDS 9, so the old manual proxy bootstrap was removed. The `/odata/v2`
  endpoint is mounted by the plugin automatically. (`srv/server.js` was later re-introduced
  only to mount the custom REST API — see §9 — and does *not* re-add the V2 proxy.)
- **Removed dead `cuid` import.** `srv/CatalogService.js` had an unused
  `const cuid = require('cuid')`. `cuid` v3 is ESM-only, so that `require` would throw at
  runtime under the upgraded deps. It was deleted (the handler never used it). `cuid` is now
  effectively unused and can be dropped from `dependencies` if desired.
- **Removed scaffolding / unsecured services.** `sampleService` (open insert/update/**delete**
  on employees and POs), `test-emp-Service` (toy model; imported an internal CDS path that
  breaks on CDS 9), the `*.http` test files, and `db/test-data-model.cds` were deleted. The UI
  only consumes `/CatalogService`, and nothing referenced these.
- **Secured the analytical service.** `CDSService` (CDS views `POWorkList`, `ProductOrders`,
  `ProductAggregation`) had no auth; it now carries `@(requires:'authenticated-user')`.
  Both exposed services (`CatalogService`, `CDSService`) now require authentication.

`srv/` is now just `CatalogService.cds` + `CatalogService.js` (real, secured) and
`CDSService.cds` (analytical, secured). The model compiles clean to V4 EDMX under CDS 9.9.x.

---

## 9. Additional features (admin-gated actions, REST API, uploads)

### Create & Delete restricted to administrators
- Backend already enforces it: the `PurchaseOrder` `@restrict` grants `['*']` only to
  `PurchaseOrder_Admin`; other roles get READ. Non-admins attempting create/delete get 403.
- UI: a virtual boolean `IsNotAdmin` is added to `PurchaseOrder` and bound to
  `@UI.CreateHidden` / `@UI.DeleteHidden`, so the Fiori Elements **Create** and **Delete**
  buttons are hidden for non-admins. `IsNotAdmin` is computed per request in
  `CatalogService.js` (`this.after('READ', PurchaseOrder, …)` → `!req.user.is('PurchaseOrder_Admin')`).

### Custom REST API (`srv/rest.js`, mounted at `/rest` by `srv/server.js`)
Plain JSON endpoints (not OData), behind the approuter's authentication:
| Method & path | Purpose |
|---------------|---------|
| `GET /rest/health` | Liveness probe |
| `GET /rest/po/summary` | Order count + gross total grouped by currency |
| `GET /rest/po/by-country` | Order count grouped by the partner's country |
| `GET /rest/po/:poId` | One purchase order (header + items) by business `PO_ID` |
| `POST /rest/attachments` | Upload a file (see below) — admin only |
| `GET /rest/attachments/:id` | Download a previously uploaded file |

Queries run through `cds.connect.to('db')` with CQL (aggregations + the
`PARTNER_GUID.ADDRESS_GUID.COUNTRY` path expression). Mounting via `cds.on('bootstrap')`
coexists with the OData V4 services and the cov2ap V2 plugin.

### File upload / download
- **CAP media entity** `db/attachments.cds` → `srini.db.transaction.attachments`
  (`content : LargeBinary @Core.MediaType`), exposed as `CatalogService.Attachments`
  (READ for authenticated users, write for `PurchaseOrder_Admin`). Files upload/download
  as binary streams over OData (`PUT`/`GET` on `Attachments(<ID>)/content`) and integrate
  with the Fiori Elements upload control if an attachments facet is added to the object page.
- **REST multipart upload** via `multer` (added to dependencies): `POST /rest/attachments`
  with form field `file` (optional `?poId=<PO_ID>` to link, optional `note`), stored in the
  same `attachments` table; `GET /rest/attachments/:id` streams it back.

> Verify in the deployed app: FE `CreateHidden`/`DeleteHidden` rendering, and (on HANA)
> the media-stream + REST upload round-trip. The model compiles clean to V4 EDMX under CDS 9.9.x.
