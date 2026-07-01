namespace srini.db;
using { cuid,managed,Currency } from '@sap/cds/common';
using { srini.common } from './common';
type Guid :UUID @Core.Computed:true @odata.Type: 'Edm.String';
context master{

  entity businesspartner{
  key NODE_KEY:Guid;
      BP_ROLE:String(2);
      EMAIL_ADDRESS:String(80);
      PHONE_NUMBER:String(14);
      FAX_NUMBER:String(14);
      WEB_ADDRESS:String(64);
      ADDRESS_GUID: Association to address;
      BP_ID:String(10);
      COMPANY_NAME:String(80);

  }

  annotate businesspartner with{
     NODE_KEY @title : '{i18n>bp_key}';
     BP_ROLE @title : '{i18n>bp_role}';
     COMPANY_NAME @title : '{i18n>CompanyName}';
     BP_ID @title : '{i18n>bpId}';
     EMAIL_ADDRESS @title : '{i18n>emailAddress}'
  }

  entity address {
    key NODE_KEY:Guid;
         CITY:String(64);
         POSTAL_CODE:String(14);
         STREET:String(64);
         BUILDING:String(64);
         COUNTRY:String(64);
         ADDRESS:String(2);
         VAL_START_DATE:Date;
         VAL_END_DATE:Date;
         LATITUDE:Decimal;
         LONGITUTE:Decimal;
         businesspartner: Association to one businesspartner on businesspartner.ADDRESS_GUID = $self;

    
 }

  entity employee:cuid {
     nameFirst:String(80);
     nameMiddle:String(80);
     nameLast:String(80);
     nameinitial:String(40);
     sex:common.Gender;
     language:String(1);
     phoneNumber:common.PhoneNumber;
     email:common.Email;
     loginName:String(12);
     currency:Currency;
     salaryAmount:common.AmountT;
     accountNumber:String(16);
     bankId:String(20);
     bankName:String(80);

     

  }


//  entity prodtext{
//   key NODE_KEY:Guid;
//     PARENT_KEY:Guid;
//     LANGUAGE:String(2);
//     TEXT:String(2);
//  }

 entity product{
  key NODE_KEY:Guid;
    PRODUCT_ID:String(30);
    TYPE_CODE:String(2);
    CATEGORY:String(32);
  //  DESC_GUID:Association to prodtext;
   DESCRIPTION:localized String(200);
    SUPPLIER_GUID:Association to businesspartner;
    TAX_TARIF_CODE:Integer;
    MEASURE_UNIT:String(2);
    WEIGHT_MEASURE:Decimal(5,2);
    WEIGHT_UNIT:String(2);
    CURRENCY_CODE:String(3);
    PRICE:Decimal(15,2);
    WIDTH:Decimal(5,2);
    DEPTH:Decimal(5,2);
    HEIGHT:Decimal(5,2);
    DIM_UNIT:String(2);


 }

}

context transaction {

 entity purchaseorder:common.Amount {
    key NODE_KEY:Guid;
        PO_ID :String(24);
        PARTNER_GUID :Association to master.businesspartner;
        LIFECYCLE_STATUS:String(1);
        OVERALL_STATUS:String(1);
        NOTE:String(60);
        Items:Composition of many poitems on Items.PARENT_KEY = $self;


 }

 entity poitems:common.Amount {
        key NODE_KEY:Guid;
            PARENT_KEY:Association to purchaseorder;
            PO_ITEM_POS:Integer;
            PRODUCT_GUID:Association to master.product;

  }



}