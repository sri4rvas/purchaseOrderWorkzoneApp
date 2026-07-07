sap.ui.define([
    "sap/m/MessageBox",
    "srini/app/purchaseorderapp/ext/lib/roles"
], function (MessageBox, Roles) {
    "use strict";

    function getJSON(sUrl) {
        return fetch(sUrl, { headers: { "Accept": "application/json" } })
            .then(function (r) {
                if (!r.ok) { throw new Error("HTTP " + r.status); }
                return r.json();
            });
    }

    return {
        // "Statistics" action on the List Report toolbar -> aggregates from the REST API.
        // URLs are resolved relative to the app root so they work under the Work Zone approuter.
        onStatistics: function () {
            Promise.all([
                getJSON(Roles.appUrl("rest/po/summary")),
                getJSON(Roles.appUrl("rest/po/by-country")),
                getJSON(Roles.appUrl("rest/health"))
            ]).then(function (aResults) {
                var oSummary = aResults[0] || {};
                var oCountry = aResults[1] || {};
                var oHealth = aResults[2] || {};
                var aLines = [];
                aLines.push("Service status : " + (oHealth.status || "?"));
                aLines.push("Total orders   : " + (oSummary.totalOrders != null ? oSummary.totalOrders : "?"));
                aLines.push("");
                aLines.push("By currency:");
                (oSummary.byCurrency || []).forEach(function (r) {
                    aLines.push("   " + r.currency + " — " + r.count + " orders, gross " + r.totalGross);
                });
                aLines.push("");
                aLines.push("By country:");
                (oCountry.byCountry || []).forEach(function (r) {
                    aLines.push("   " + (r.country || "(n/a)") + " — " + r.count + " orders");
                });
                MessageBox.information(aLines.join("\n"), { title: "Purchase Order Statistics" });
            }).catch(function (e) {
                MessageBox.error("Could not load statistics: " + e.message);
            });
        }
    };
});
