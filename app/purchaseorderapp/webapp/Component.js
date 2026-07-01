sap.ui.define(
    ["sap/fe/core/AppComponent", "sap/ui/model/json/JSONModel"],
    function (Component, JSONModel) {
        "use strict";

        return Component.extend("srini.app.purchaseorderapp.Component", {
            metadata: {
                manifest: "json"
            },

            init: function () {
                Component.prototype.init.apply(this, arguments);
                // Named model backing the custom Attachments section (populated via the REST API)
                this.setModel(new JSONModel({ items: [] }), "att");
            }
        });
    }
);
