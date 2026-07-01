# Purchase Order restriction by Business Partner (PARTNER_GUID_NODE_KEY)

## What was added
- **Expanded multi-currency data** (`db/csv/`): purchaseorder, poitems, product, employee,
  businesspartner, address — now spanning AUD, CAD, CNY, EUR, GBP, INR, JPY, USD across
  15 business partners (5 US, 4 India; 1 address each) (FKs validated).
- **Separate role template** `PurchaseOrder_CompanyViewer` (scope
  `PurchaseOrder_CompanyViewer`) with attribute **`PARTNER_GUID_NODE_KEY`**.
- **Service-layer `@restrict`** on `PurchaseOrder` and `PurchaseOrderItems` in
  `srv/CatalogService.cds`:
  - `PurchaseOrder_Admin` → `grant: ['*']` (wide access, all partners, full CRUD + draft).
  - `PurchaseOrder_CompanyViewer` → `grant: ['READ']` filtered by
    `PARTNER_GUID.NODE_KEY = $user.PARTNER_GUID_NODE_KEY`
    (items filtered via `PARENT_KEY.PARTNER_GUID.NODE_KEY`).

A user with the partner-viewer role sees only the POs of the partner GUID set on their role;
an admin sees everything.

## PARTNER_GUID_NODE_KEY values (use as the role attribute)
| PARTNER_GUID_NODE_KEY | Company | Country | Currency |
|---|---|---|---|
| B0000000000000000000000000000001 | Tokyo Tech KK | Japan | JPY |
| B0000000000000000000000000000002 | London Components Ltd | United Kingdom | GBP |
| B0000000000000000000000000000003 | Bavaria Elektronik GmbH | Germany | EUR |
| B0000000000000000000000000000004 | Bharat Devices Pvt | India | INR |
| B0000000000000000000000000000005 | Shanghai Hardware Co | China | CNY |
| B0000000000000000000000000000006 | Sydney Supplies Pty | Australia | AUD |
| B0000000000000000000000000000007 | Global Axis Inc | United States | USD |
| B0000000000000000000000000000008 | Toronto Systems Inc | Canada | CAD |
| B0000000000000000000000000000009 | Liberty Microsystems | United States | USD |
| B0000000000000000000000000000010 | Pacific Computing Inc | United States | USD |
| B0000000000000000000000000000011 | Lone Star Electronics | United States | USD |
| B0000000000000000000000000000012 | Great Lakes Tech | United States | USD |
| B0000000000000000000000000000013 | Chennai Systems Ltd | India | INR |
| B0000000000000000000000000000014 | Bengaluru Microtech | India | INR |
| B0000000000000000000000000000015 | Delhi Components Pvt | India | INR |

## Assigning access (BTP Cockpit)
**Option A — ready-made examples** (already in `xs-security.json`): assign role collection
`PurchaseOrder_Company_TokyoTech` or `PurchaseOrder_Company_London` to a user.

**Option B — any partner:** Security → Roles → create a role from template
`PurchaseOrder_CompanyViewer`, set attribute `PARTNER_GUID_NODE_KEY` (Static) to the GUID
from the table → add it to a Role Collection → assign to the user. Re-login to refresh the token.

For wide access, assign a role collection containing `PurchaseOrder_Admin`.

## Local test (cds watch, mock auth)
| User | Role | Sees |
|------|------|------|
| `srini` | PurchaseOrder_Admin | all POs |
| `company_tokyo` | PurchaseOrder_CompanyViewer | only Tokyo Tech POs (JPY) |
| `company_london` | PurchaseOrder_CompanyViewer | only London Components POs (GBP) |

(password: `myPassword`)

## Country-based alternative

A parallel `PurchaseOrder_CountryViewer` role (attribute `Country`) filters POs by the partner's country via `PARTNER_GUID.ADDRESS_GUID.COUNTRY = $user.Country`. Ready-made collections: `PurchaseOrder_from_US` (United States) and `PurchaseOrder_from_India` (India). Country values are the full names in `address.COUNTRY`.
