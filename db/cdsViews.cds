namespace  srini.db;
using { srini.db.master, srini.db.transaction} from './datamodel';

context CDSViews { 

  define view![POWorklist] as 
    select from transaction.purchaseorder{
        key PO_ID as ![PurchaseOrderId],
            PARTNER_GUID.BP_ID as ![PartnerId],
            PARTNER_GUID.COMPANY_NAME AS ![CompanyName],
            GROSS_AMOUNT as ![POGrossAmount],
            CURRENCY as ![POCurrencyCode],
            LIFECYCLE_STATUS as ![POStatus],
        key Items.PO_ITEM_POS as ![ItemID],
            Items.PRODUCT_GUID.PRODUCT_ID as ![ProductId],
            Items.PRODUCT_GUID.DESCRIPTION as ![ProductName],
            PARTNER_GUID.ADDRESS_GUID.CITY as ![City],
            PARTNER_GUID.ADDRESS_GUID.COUNTRY as ![Country],
            Items.GROSS_AMOUNT as ![GrossAmount],
            Items.NET_AMOUNT as ![NetAmount],
            Items.TAX_AMOUNT as ![TaxAmount],
            Items.CURRENCY as ![CurrencyCode]
    };


 define view ProductValueHelp as 
           select from master.product{
            
             @EndUserText.label:[
                {
                    language:'EN',
                    text:'Product ID'
                },
                {
                    language:'GE',
                    text:'Prodekt ID'
                }
             ]
      key      PRODUCT_ID as ![ProductID],

              @EndUserText.label:[
                {
                    language:'EN',
                    text:'Product Description'
                },
                {
                    language:'GE',
                    text:'Prodekt Description'
                }
             ]
             DESCRIPTION as ![Description]
    };



define view![ItemView] as 
    select from transaction.poitems{
       PARENT_KEY.PARTNER_GUID.NODE_KEY as ![Partner],
    key   PRODUCT_GUID.NODE_KEY as ![ProductId],
       CURRENCY as ![CurrencyCode],
       GROSS_AMOUNT as ![GrossAmount],
       NET_AMOUNT as ![NetAmount],
       TAX_AMOUNT as ![TaxAmount],
       PARENT_KEY.OVERALL_STATUS as ![POStatus]

   };

define view ProductViewSub as
  select from master.product as prod{
 key   PRODUCT_ID as ![ProductId],
    texts.DESCRIPTION as ![Description],
    (
      select from transaction.poitems as a{
         SUM(a.GROSS_AMOUNT) as SUM:Decimal(15,2)
      }
      where a.PRODUCT_GUID.NODE_KEY = prod.NODE_KEY  
     
    ) as PO_SUM:Decimal(15,2)
  };

define view ProductView as select from master.product
  mixin{
    PO_ORDERS: Association[*] to ItemView on
                   PO_ORDERS.ProductId = $projection.ProductId
  }
  into{
    NODE_KEY as ![ProductId],
    DESCRIPTION as ![Description],
    CATEGORY AS ![Category],
    PRICE as ![Price],
    TYPE_CODE as ![TypeCode],
    SUPPLIER_GUID.BP_ID AS ![BPid],
    SUPPLIER_GUID.COMPANY_NAME as ![CompanyName],
    SUPPLIER_GUID.ADDRESS_GUID.CITY as ![City],
    SUPPLIER_GUID.ADDRESS_GUID.COUNTRY as ![Country],

    //Exposed Association , which means when someone read the view
    // the data for orders wont be read by default
    // until unless some once accessed the association
    PO_ORDERS
  } ;

  define view CProductValueView as
     select from ProductView{
        ProductId,
        Country,
        PO_ORDERS.CurrencyCode as ![CurrencyCode],
        sum(PO_ORDERS.GrossAmount) as ![POGrossAmount]:Decimal(15,2)
     }
     group by ProductId,Country,PO_ORDERS.CurrencyCode;             

    

 

}


