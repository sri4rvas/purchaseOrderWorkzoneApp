sap.ui.define([], function () {
    "use strict";

    var _adminPromise;

    // Resolve a path relative to THIS app's root so it works both locally and under the
    // Work Zone managed approuter (which serves the app under a path prefix + ~cachebuster~).
    // Absolute paths like "/CatalogService/..." would hit the launchpad site root (404).
    function appUrl(sRelPath) {
        return sap.ui.require.toUrl("srini/app/purchaseorderapp/" + String(sRelPath).replace(/^\//, ""));
    }

    // Whether the current user is an administrator (cached). Uses the CAP
    // unbound function isAdmin(), where req.user is reliably populated.
    function isAdmin() {
        if (!_adminPromise) {
            _adminPromise = fetch(appUrl("CatalogService/isAdmin()"), { headers: { "Accept": "application/json" } })
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (d) { return !!(d && (d.value === true || d.isAdmin === true)); })
                .catch(function () { return false; });
        }
        return _adminPromise;
    }

    function hideMatching(oView, oRegExp) {
        oView.findAggregatedObjects(true, function (oCtrl) {
            if (oCtrl && oCtrl.getId && oRegExp.test(oCtrl.getId()) && typeof oCtrl.setVisible === "function") {
                if (oCtrl.getVisible()) { oCtrl.setVisible(false); }
            }
            return false;
        });
    }

    // Hide the given Fiori Elements standard actions (Create/Update/Delete) for
    // non-administrators. Retried a few times because FE builds the buttons async.
    function hideStandardActionsIfNotAdmin(oView, aKinds) {
        if (!oView) { return; }
        isAdmin().then(function (bAdmin) {
            if (bAdmin) { return; }
            var oRegExp = new RegExp("StandardAction::(" + aKinds.join("|") + ")");
            [0, 300, 800, 1500, 2500].forEach(function (iDelay) {
                setTimeout(function () { hideMatching(oView, oRegExp); }, iDelay);
            });
        });
    }

    return {
        appUrl: appUrl,
        isAdmin: isAdmin,
        hideStandardActionsIfNotAdmin: hideStandardActionsIfNotAdmin
    };
});
