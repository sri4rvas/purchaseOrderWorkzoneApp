sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'srini/app/purchaseorderapp/test/integration/FirstJourney',
		'srini/app/purchaseorderapp/test/integration/pages/PurchaseOrderList',
		'srini/app/purchaseorderapp/test/integration/pages/PurchaseOrderObjectPage',
		'srini/app/purchaseorderapp/test/integration/pages/PurchaseOrderItemsObjectPage'
    ],
    function(JourneyRunner, opaJourney, PurchaseOrderList, PurchaseOrderObjectPage, PurchaseOrderItemsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('srini/app/purchaseorderapp') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePurchaseOrderList: PurchaseOrderList,
					onThePurchaseOrderObjectPage: PurchaseOrderObjectPage,
					onThePurchaseOrderItemsObjectPage: PurchaseOrderItemsObjectPage
                }
            },
            opaJourney.run
        );
    }
);