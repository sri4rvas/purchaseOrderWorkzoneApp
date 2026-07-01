# Fix: `Unable to install node: no match found for ^16 || ^18 || ^20 in [22.x 24.x]`

## Root cause
The Cloud Foundry Node.js buildpack now ships only **Node 22 and 24**. The CAP backend
(`PurchaseOrder-srv`) is built from `@sap/cds` 7, whose `cds build` writes
`engines.node: "^16 || ^18 || ^20"` into `gen/srv/package.json`. None of 16/18/20 is
available, so staging aborts while installing Node — and because the build never finishes,
the HTML5 content also ends up empty (the earlier empty `data.zip` / `CODE 1001`).

## Fix applied
An explicit `engines` field was added to the **root `package.json`**:

```json
"engines": { "node": "^18 || ^20 || ^22" }
```

`cds build --production` propagates this into `gen/srv/package.json` (verified), so the
buildpack now selects **Node 22** (22.x matches; 24.x is intentionally excluded, since
CDS 7 isn't validated on Node 24).

> The project's old `package-lock.json` was removed so a fresh `npm install` resolves
> `@sap/cds` to the latest 7.9.x, which runs cleanly on Node 22. A new lock file is
> generated on first install.

## Rebuild & redeploy (clean)
```bash
unset NODE_ENV
rm -rf gen resources mta_archives node_modules \
       app/purchaseorderapp/node_modules app/purchaseorderapp/dist

npm install

# verify the propagated engines BEFORE building the mtar:
npx cds build --production
grep -A2 '"engines"' gen/srv/package.json     # must show ^18 || ^20 || ^22

mbt build -p=cf
cf deploy mta_archives/atcapm_1.0.0.mtar
```

## If staging still complains about Node
- Confirm `gen/srv/package.json` shows `^18 || ^20 || ^22` (step above). If it still shows
  `^16 || ^18 || ^20`, your locked `@sap/cds` is old — run `npm update @sap/cds @sap/cds-dk`.
- For a longer-term, fully-supported setup, upgrade to CDS 8
  (`@sap/cds@^8`, `@sap/cds-dk@^8`), which natively targets Node 20/22; then
  `engines.node` can be `>=20`. (CDS 8 has minor breaking changes, so test locally with
  `cds watch` first.)
