# Fix: `CODE 1001 – Could not find applications in the request`

This error during `cf deploy` means the zip uploaded for `purchaseorderapp` to the
HTML5 Application Repository (`PurchaseOrder-html5-repo-host`) **contained no app** — i.e.
`resources/purchaseorderapp.zip` inside the `.mtar` was empty or had no `manifest.json`
at its root. The `mta.yaml` wiring itself is correct (it matches SAP's canonical
CAP→HTML5-repo pattern), so the problem is the *build output*, not the descriptor.

## What was changed
The UI module's build step now forces dev dependencies:

```yaml
commands:
  - npm install --include=dev   # was: npm install
  - npm run build:cf
```

If `NODE_ENV=production` is set in your shell, a plain `npm install` skips
`devDependencies` — including `@ui5/cli` — so `ui5 build` produces nothing and an empty
zip is packaged. `--include=dev` guarantees `@ui5/cli` is present during `mbt build`.

## Rebuild cleanly and redeploy

```bash
# 1. clear stale build output
rm -rf gen resources mta_archives \
       app/purchaseorderapp/dist app/purchaseorderapp/node_modules

# 2. (optional but recommended) make sure NODE_ENV is not forcing prod
unset NODE_ENV

# 3. rebuild
npm install
mbt build -p=cf

# 4. VERIFY the app zip is real before deploying  <-- the key check
cd mta_archives && unzip -o PurchaseOrder_1.0.0.mtar -d _inspect >/dev/null
find _inspect -name 'purchaseorderapp.zip' -exec ls -l {} \;
#   -> the zip must be a few hundred KB, NOT ~0 bytes
unzip -l "$(find _inspect -name 'purchaseorderapp.zip' | head -1)" | grep -E 'manifest.json|xs-app.json'
#   -> you must see  manifest.json  AND  xs-app.json  at the root (no leading folder)
cd ..

# 5. deploy
cf deploy mta_archives/PurchaseOrder_1.0.0.mtar
```

(If your archive is named `atcapm_1.0.0.mtar`, the `ID:` in `mta.yaml` is still `atcapm`;
the file is named after the MTA ID, not the xsappname. Adjust the filename above accordingly.)

## If it still fails

1. **Confirm the UI builds on its own:**
   ```bash
   cd app/purchaseorderapp
   npm install --include=dev
   npm run build:cf
   ls dist/manifest.json dist/xs-app.json     # both must exist
   ```
   If `ui5: command not found` or `dist` is empty, the build — not the deploy — is the
   real failure. Share that console output.

2. **Stale / corrupt app-host instance** from an earlier partial deploy can also cause
   1001. Remove it and redeploy:
   ```bash
   cf undeploy PurchaseOrder --delete-services --delete-service-keys
   # or delete just the instance:  cf delete-service PurchaseOrder-html5-repo-host
   cf deploy mta_archives/PurchaseOrder_1.0.0.mtar
   ```
   (`cf undeploy` takes the **MTA ID**, which is `atcapm` unless you changed it.)

3. If the `purchaseorderapp.zip` in step 4 is empty even though the standalone build in
   step 1 works, paste the `mbt build` console section for
   `Building application project srini.app.purchaseorderapp` — that will pinpoint it.
