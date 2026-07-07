sap.ui.define([], function () {
    "use strict";

    var _adminPromise;
    var _odataBase;   // resolved ".../CatalogService/" as used by the OData model (BAS & Work Zone)

    // Capture the base URL from the default OData model. getServiceUrl() returns the URL
    // Fiori Elements actually uses for data requests, so it is correct both locally (BAS)
    // and under the Work Zone managed approuter (path prefix + ~cachebuster~).
    function captureBase(oModel) {
        if (_odataBase) { return; }
        var s = oModel && oModel.getServiceUrl && oModel.getServiceUrl();
        if (!s) { return; }
        if (s.charAt(s.length - 1) !== "/") { s += "/"; }
        _odataBase = s;
    }

    function odataUrl(sPath) {
        return (_odataBase || "/CatalogService/") + sPath;                 // -> .../CatalogService/<path>
    }
    function restUrl(sPath) {
        return (_odataBase || "/CatalogService/").replace(/CatalogService\/$/, "") + sPath; // -> .../<path>
    }

    // Whether the current user is an administrator (cached), via the CAP isAdmin() function.
    function isAdmin() {
        if (!_adminPromise) {
            _adminPromise = fetch(odataUrl("isAdmin()"), { headers: { "Accept": "application/json" } })
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

    // Hide FE standard actions (Create/Update/Delete) for non-admins, retried for async rendering.
    function hideStandardActionsIfNotAdmin(oView, aKinds) {
        if (!oView) { return; }
        captureBase(oView.getModel());
        isAdmin().then(function (bAdmin) {
            if (bAdmin) { return; }
            var oRegExp = new RegExp("StandardAction::(" + aKinds.join("|") + ")");
            [0, 300, 800, 1500, 2500].forEach(function (iDelay) {
                setTimeout(function () { hideMatching(oView, oRegExp); }, iDelay);
            });
        });
    }

    return {
        captureBase: captureBase,
        odataUrl: odataUrl,
        restUrl: restUrl,
        isAdmin: isAdmin,
        hideStandardActionsIfNotAdmin: hideStandardActionsIfNotAdmin
    };
});
