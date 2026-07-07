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
        // "Statistics" action -> aggregates from the REST API. URLs are built from the OData
        // model's service URL (captured on init) so they work in BAS and Work Zone alike.
        onStatistics: function (oEvent) {
            var oSrc = oEvent && oEvent.getSource && oEvent.getSource();
            if (oSrc && oSrc.getModel) { Roles.captureBase(oSrc.getModel()); }
            Promise.all([
                getJSON(Roles.restUrl("rest/po/summary")),
                getJSON(Roles.restUrl("rest/po/by-country")),
                getJSON(Roles.restUrl("rest/health"))
            ]).then(function (aResults) {
                var oSummary = aResults[0] || {}, oCountry = aResults[1] || {}, oHealth = aResults[2] || {};
                var aLines = [];
                aLines.push("Service status : " + (oHealth.status || "?"));
                aLines.push("Total orders   : " + (oSummary.totalOrders != null ? oSummary.totalOrders : "?"));
                aLines.push("");
                aLines.push("By currency:");
                (oSummary.byCurrency || []).forEach(function (r) {
                    aLines.push("   " + r.currency_code + " — " + r.count + " orders, gross " + r.totalGross);
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
