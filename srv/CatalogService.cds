using {
  srini.db.master,
  srini.db.transaction
} from '../db/datamodel';

@(path: '/CatalogService')
service CatalogService @(requires:'authenticated-user'){
  
  @Capabilities: {
    Insertable,
    Updatable: false,
    Deletable,
  }
  entity EmployeeSet @(restrict:[{
    grant:['READ'],
    to:'Employee_Viewer',
    where:'bankName = $user.BankName'
  },{
    grant:['WRITE'],
    to:'PurchaseOrder_Admin'
  }
  ])                                        as projection on master.employee;

  @readonly
  entity AddressSet                                         as projection on master.address;

  entity ProductSet                                     as projection on master.product;
  //  entity ProductTextSet as projection on master.prodtext;
  entity BPSet                                              as projection on master.businesspartner;

  entity PurchaseOrder @(
    title              : '{i18n>poEntity}',
    odata.draft.enabled: true,
    restrict           : [
      {grant: ['*'],    to: 'PurchaseOrder_Admin'},
      {grant: ['READ'], to: 'PurchaseOrder_CompanyViewer', where: 'PARTNER_GUID.NODE_KEY = $user.PARTNER_GUID_NODE_KEY'},
      {grant: ['READ'], to: 'PurchaseOrder_CountryViewer', where: 'PARTNER_GUID.ADDRESS_GUID.COUNTRY = $user.Country'}
    ]
  )                                                         as
    projection on transaction.purchaseorder {
      *,
      round(
        GROSS_AMOUNT, 2
      )   as GROSS_AMOUNT     : Decimal(15, 2),
      case LIFECYCLE_STATUS
        when
          'N'
        then
          'New'
        when
          'D'
        then
          'Delivered'
        when
          'B'
        then
          'Blocked'
      end as LIFECYCLE_STATUS : String(20),
      case LIFECYCLE_STATUS
        when
          'N'
        then
          2
        when
          'B'
        then
          1
        when
          'D'
        then
          3
      end as Criticality      : Integer,
      PARTNER_GUID,
      Items                   : redirected to PurchaseOrderItems
    }
    actions {
      function largestOrder() returns array of PurchaseOrder;
      action   boost();
    };

  annotate PurchaseOrder with {
    GROSS_AMOUNT     @title: '{i18n>grossAmount}';
    LIFECYCLE_STATUS @title: '{i18n>lifeCycleStatus}'
  };


  entity PurchaseOrderItems @(
    title   : '{i18n>poItemEntity}',
    restrict: [
      {grant: ['*'],    to: 'PurchaseOrder_Admin'},
      {grant: ['READ'], to: 'PurchaseOrder_CompanyViewer', where: 'PARENT_KEY.PARTNER_GUID.NODE_KEY = $user.PARTNER_GUID_NODE_KEY'},
      {grant: ['READ'], to: 'PurchaseOrder_CountryViewer', where: 'PARENT_KEY.PARTNER_GUID.ADDRESS_GUID.COUNTRY = $user.Country'}
    ]
  ) as
    projection on transaction.poitems {
      *,
      PARENT_KEY   : redirected to PurchaseOrder,
      PRODUCT_GUID : redirected to ProductSet
    };

}
