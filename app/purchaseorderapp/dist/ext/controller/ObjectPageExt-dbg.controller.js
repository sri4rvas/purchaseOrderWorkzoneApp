sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "srini/app/purchaseorderapp/ext/lib/roles"
], function (ControllerExtension, Roles) {
    "use strict";

    return ControllerExtension.extend("srini.app.purchaseorderapp.ext.controller.ObjectPageExt", {
        override: {
            onInit: function () {
                // Hide Edit/Delete on the object page for non-administrators
                Roles.hideStandardActionsIfNotAdmin(this.base.getView(), ["Edit", "Delete"]);
            },
            routing: {
                onAfterBinding: function () {
                    // re-apply on each navigation (FE builds buttons asynchronously)
                    Roles.hideStandardActionsIfNotAdmin(this.base.getView(), ["Edit", "Delete"]);
                }
            }
        }
    });
});
