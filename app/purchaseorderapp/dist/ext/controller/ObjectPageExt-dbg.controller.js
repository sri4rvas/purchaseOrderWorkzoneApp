sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "srini/app/purchaseorderapp/ext/fragment/Attachments"
], function (ControllerExtension, Attachments) {
    "use strict";

    return ControllerExtension.extend("srini.app.purchaseorderapp.ext.controller.ObjectPageExt", {
        override: {
            routing: {
                // Fires whenever the object page is bound to a context.
                // For a purchase order, auto-load its attachments into the "att" model.
                onAfterBinding: function (oBindingContext) {
                    if (!oBindingContext) { return; }
                    var oView = this.base.getView();
                    var oModel = oView && oView.getModel("att");
                    if (!oModel) { return; }
                    // PO_ID exists only on PurchaseOrder (not on the Items object page);
                    // NODE_KEY is the foreign key used to filter Attachments over OData.
                    oBindingContext.requestObject().then(function (oObj) {
                        if (oObj && oObj.PO_ID && oObj.NODE_KEY) {
                            Attachments.loadInto(oModel, oObj.NODE_KEY);
                        } else {
                            oModel.setProperty("/items", []);
                        }
                    }).catch(function () { /* not a PurchaseOrder context — ignore */ });
                }
            }
        }
    });
});
