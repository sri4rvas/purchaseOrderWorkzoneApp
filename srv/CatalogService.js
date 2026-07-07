const cds = require('@sap/cds');
// module.export = cds.service.impl(async function () {

//     const { EmployeeSet, PurchaseOrder } = this.entities;

//     this.before('UPDATE', EmployeeSet, (req, res) => {
//         if (parseFloat(req.data.salaryAmount) > 1000000) {
//             req.error(500, "salary must be below 1 mn");
//         }
//     });


//     this.on('boost', async req => {

//         try {
//             const id = req.params[0];
//             console.log("Your Purchase order with ID --->" + id + "will be Boosted");
//             const tx = cds.tx(req);
//             await tx.update(PurchaseOrder).with({
//                 GROSS_AMOUNT: round({ '+=': 20000 }, 2),
//                 NOTE: "Boosted!!"
//             }).where({ ID: id });
//             return "Boosted successfully";
//         } catch (error) {
//             return "Boosted failed :" + error.toString();
//         }
//     });


//     this.on('largestOrder', async req => {

//         try {
//             const id = req.params[0];
//             console.log("Your Purchase order with ID --->" + id + "will be Boosted");
//             const tx = cds.tx(req);
//             const res = await tx.read(PurchaseOrder).orderBy({
//                 GROSS_AMOUNT: 'desc'
//             }).limit(1);
//         } catch (error) {
//             return "failed to fech largest order" + error.toString();
//         }
//     });


// });



class CatalogService extends cds.ApplicationService {
    init() {
        /**
         * Reflect definitions from the service's CDS model
         */
        const { EmployeeSet, PurchaseOrder } = this.entities;

        //
        // Hide Create/Delete in the Fiori UI for non-administrators.
        // Sets the virtual IsNotAdmin flag that UI.CreateHidden/DeleteHidden bind to.
        //
        this.after('READ', PurchaseOrder, (data, req) => {
            const isAdmin = !!(req.user && typeof req.user.is === 'function' && req.user.is('PurchaseOrder_Admin'));
            const rows = Array.isArray(data) ? data : (data ? [data] : []);
            for (const row of rows) if (row) row.IsNotAdmin = !isAdmin;
        });

        // Unbound function: is the current user an administrator?
        this.on('isAdmin', (req) =>
            !!(req.user && typeof req.user.is === 'function' && req.user.is('PurchaseOrder_Admin'))
        );



        //
        // Action Implementations...
        //
        this.on('boost', async req => {

            console.log(req.toString());
            try {
                const id = req.params[0];
              //  delete id.IsActiveEntity;
                // console.log("Your Purchase order with ID --->"+stringify(id)+"will be Boosted");
                const tx = cds.tx(req);
                await tx.update(PurchaseOrder).with({
                    GROSS_AMOUNT: { '+=': 20000 },
                    NOTE: "Boosted!!"
                }).where(id);
                console.log("Boosted successfully");
                return "Boosted successfully";
            } catch (error) {
                console.log("error" + error.toString());
                return "Boosted failed :" + error.toString();
            }
        });

        this.on('largestOrder', async req => {
            try {
                const id = req.params[0];
                console.log("Fetching Largest Order  ID --->" + id);
                const tx = cds.tx(req);
                const res = await tx.read(PurchaseOrder).orderBy({
                    GROSS_AMOUNT: 'desc'
                }).limit(1);
                return res;
            } catch (error) {
                return "failed to fech largest order" + error.toString();
            }
        });


        // Add base class's handlers. Handlers registered above go first.
        return super.init()

    }
}
module.exports = { CatalogService };