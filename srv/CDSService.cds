using { srini.db.CDSViews } from '../db/cdsViews';
using { srini.db.master, srini.db.transaction} from '../db/datamodel';
@(path:'/CDSServices')
service CDSService @(requires:'authenticated-user') {

    entity POWorkList as projection on CDSViews.POWorklist;

    entity ProductOrders as projection on CDSViews.ProductViewSub;

    entity ProductAggregation as projection on CDSViews.CProductValueView;



  }
