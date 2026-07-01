sap.ui.define([
    "sap/m/MessageBox"
], function (MessageBox) {
    "use strict";

    function getJSON(sUrl) {
        return fetch(sUrl, { headers: { "Accept": "application/json" } }).then(function (r) { return r.json(); });
    }

    return {
        // "Statistics" action on the List Report toolbar -> aggregates from the REST API
        onStatistics: function () {
            Promise.all([
                getJSON("/rest/po/summary"),
                getJSON("/rest/po/by-country"),
                getJSON("/rest/health")
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
