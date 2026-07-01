sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (MessageToast, MessageBox) {
    "use strict";

    // OData V4 service base (same path the mainService dataSource uses)
    var SVC = "/CatalogService";

    function parseError(sText) {
        try { var o = JSON.parse(sText); return o && o.error && o.error.message; } catch (e) { return null; }
    }

    // Fetch a CSRF token so modifying OData requests are accepted through the approuter
    function fetchCsrfToken() {
        return fetch(SVC + "/", { headers: { "x-csrf-token": "fetch" } })
            .then(function (r) { return r.headers.get("x-csrf-token") || ""; })
            .catch(function () { return ""; });
    }

    // PurchaseOrder technical key (used as the attachment's po_NODE_KEY foreign key)
    function poKeyOf(oControl) {
        var oCtx = oControl.getBindingContext();
        return oCtx && oCtx.getProperty("NODE_KEY");
    }

    // (Re)load the attachment list for a PO via OData into the "att" model
    function loadInto(oModel, sPoKey) {
        if (!oModel || !sPoKey) { return Promise.resolve(); }
        var sUrl = SVC + "/Attachments"
            + "?$select=ID,fileName,mimeType,fileSize,createdBy,createdAt"
            + "&$filter=po_NODE_KEY eq " + sPoKey            // Edm.Guid literal (no quotes)
            + "&$orderby=createdAt desc";
        return fetch(sUrl, { headers: { "Accept": "application/json" } })
            .then(function (r) { return r.json(); })
            .then(function (d) { oModel.setProperty("/items", (d && d.value) || []); })
            .catch(function (e) { MessageBox.error("Could not load files: " + e.message); });
    }

    function loadList(oControl, sPoKey) {
        return loadInto(oControl.getModel("att"), sPoKey);
    }

    return {
        // shared loader, also used by the object page controller extension for auto-load
        loadInto: loadInto,

        // Refresh button
        onRefresh: function (oEvent) {
            var oSrc = oEvent.getSource();
            loadList(oSrc, poKeyOf(oSrc));
        },

        // File chosen -> create the OData media entity, PUT its content stream, then refresh
        onFileChange: function (oEvent) {
            var oFU = oEvent.getSource();
            var aFiles = oEvent.getParameter("files");
            var oFile = aFiles && aFiles[0];
            if (!oFile) { return; }
            var sPoKey = poKeyOf(oFU);
            if (!sPoKey) {
                MessageBox.warning("Save the purchase order before adding files.");
                oFU.clear();
                return;
            }
            var sType = oFile.type || "application/octet-stream";
            var sToken;

            fetchCsrfToken().then(function (tok) {
                sToken = tok;
                // 1) create the attachment entity (metadata + FK link)
                return fetch(SVC + "/Attachments", {
                    method: "POST",
                    headers: Object.assign(
                        { "Content-Type": "application/json", "Accept": "application/json" },
                        tok ? { "x-csrf-token": tok } : {}
                    ),
                    body: JSON.stringify({
                        fileName: oFile.name,
                        mimeType: sType,
                        fileSize: oFile.size,
                        po_NODE_KEY: sPoKey
                    })
                });
            }).then(function (r) {
                if (!r.ok) { return r.text().then(function (t) { throw new Error(parseError(t) || ("HTTP " + r.status)); }); }
                return r.json();
            }).then(function (oCreated) {
                // 2) upload the binary to the media stream: PUT Attachments(<ID>)/content
                return fetch(SVC + "/Attachments(" + oCreated.ID + ")/content", {
                    method: "PUT",
                    headers: Object.assign(
                        { "Content-Type": sType },
                        sToken ? { "x-csrf-token": sToken } : {}
                    ),
                    body: oFile
                }).then(function (r2) {
                    if (!r2.ok) { return r2.text().then(function (t) { throw new Error(parseError(t) || ("content upload HTTP " + r2.status)); }); }
                });
            }).then(function () {
                MessageToast.show("Uploaded: " + oFile.name);
                oFU.clear();
                return loadList(oFU, sPoKey);
            }).catch(function (e) {
                MessageBox.error("Upload failed: " + e.message);
                oFU.clear();
            });
        },

        // List item pressed -> download the media stream via OData
        onDownload: function (oEvent) {
            var sId = oEvent.getSource().data("id");
            if (sId) {
                window.open(SVC + "/Attachments(" + sId + ")/content", "_blank");
            }
        }
    };
});
