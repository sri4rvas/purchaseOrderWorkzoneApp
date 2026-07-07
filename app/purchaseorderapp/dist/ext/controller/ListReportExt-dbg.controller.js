sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "srini/app/purchaseorderapp/ext/lib/roles"
], function (ControllerExtension, Roles) {
    "use strict";

    return ControllerExtension.extend("srini.app.purchaseorderapp.ext.controller.ListReportExt", {
        override: {
            onInit: function () {
                Roles.hideStandardActionsIfNotAdmin(this.base.getView(), ["Create", "Delete"]);
            }
        }
    });
});
