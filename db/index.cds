using { srini.db.master,srini.db.transaction  } from './datamodel';

annotate master.businesspartner with {
 NODE_KEY @title : '{i18n>bpKey}';
 BP_ROLE @title : '{i18n>bpRole}';
 COMPANY_NAME @title : '{i18n>companyName}';
 BP_ID @title : '{i18n>bpId}';
 EMAIL_ADDRESS @title : '{i18n>emailAddress}';
 PHONE_NUMBER @title : '{i18n>phoneNumber}';
 FAX_NUMBER @title : '{i18n>faxNumber}';
 WEB_ADDRESS @title : '{i18n>webAddress}';
ADDRESS_GUID @title : '{i18n>AddressGuid}';
} ;

annotate master.address with {
    NODE_KEY @title : '{i18n>addressKey}';
    CITY @title : '{i18n>city}';
    POSTAL_CODE @title : '{i18n>postalCode}';
    STREET @title : '{i18n>street}';
    BUILDING @title : '{i18n>building}';
    COUNTRY @title : '{i18n>country}';
//    ADDRESS_TYPE @title : '{i18n>addressType}';
    VAL_START_DATE @title : '{i18n>valStartDate}';
    VAL_END_DATE @title : '{i18n>valEndDate}';
    LATITUDE @title : '{i18n>latitude}';
    LONGITUTE @title : '{i18n>longitude}';
    businesspartner  @title : '{i18n>businessPartner}';
};

annotate master.product with {
    NODE_KEY @title : '{i18n>productKey}';
    PRODUCT_ID @title : '{i18n>productID}';
    TYPE_CODE @title : '{i18n>typeCode}';
    CATEGORY @title : '{i18n>category}';
    DESCRIPTION@title : '{i18n>description}';
    SUPPLIER_GUID @title : '{i18n>supplierKey}';
//    ADDRESS_TYPE @title : '{i18n>addressType}';
    TAX_TARIF_CODE @title : '{i18n>taxTarifCode}';
    MEASURE_UNIT @title : '{i18n>measureUnit}';
    WEIGHT_MEASURE @title : '{i18n>weightMeasure}';
    WEIGHT_UNIT @title : '{i18n>wightUnit}';
    CURRENCY_CODE  @title : '{i18n>currencyCode}';
    PRICE  @title : '{i18n>price}';
    WIDTH  @title : '{i18n>width}';
    DEPTH  @title : '{i18n>depth}';
    HEIGHT  @title : '{i18n>height}';
    DIM_UNIT  @title : '{i18n>DimensionUnit}';
};

annotate master.employee with {
    nameFirst @title : '{i18n>firstName}';
    nameMiddle @title : '{i18n>middleName}';
    nameLast @title : '{i18n>lastName}';
    nameinitial @title : '{i18n>initialName}';
    sex @title : '{i18n>sex}';
    language @title : '{i18n>language}';
    phoneNumber @title : '{i18n>phoneNumber}';
    email @title : '{i18n>email}';
    loginName @title : '{i18n>loginName}';
    currency @title : '{i18n>currency}';
    salaryAmount  @title : '{i18n>salary}';
    accountNumber  @title : '{i18n>accountNo}';
    bankId  @title : '{i18n>bankID}';
    bankName  @title : '{i18n>bankName}';    
} ;


annotate transaction.purchaseorder with {
    NODE_KEY@title : '{i18n>poKey}';
    PO_ID @title : '{i18n>poID}';
    PARTNER_GUID @title : '{i18n>PartnerKey}';
    LIFECYCLE_STATUS @title : '{i18n>lifeCycleStatus}';
    OVERALL_STATUS @title : '{i18n>overallStatus}';
    Items @title : '{i18n>poLineItems}';
    GROSS_AMOUNT @title : '{i18n>grossAmount}';
    NET_AMOUNT @title : '{i18n>netAmount}';
    CURRENCY @title : '{i18n>currency}';
    TAX_AMOUNT @title : '{i18n>taxAmount}';  
} ;


annotate transaction.poitems with {
    NODE_KEY@title : '{i18n>poItemKey}';
    PARENT_KEY @title : '{i18n>ParentKey}';
    PO_ITEM_POS @title : '{i18n>poItemID}';
    PRODUCT_GUID @title : '{i18n>ProductKey}';
    GROSS_AMOUNT @title : '{i18n>grossAmount}';
    NET_AMOUNT @title : '{i18n>netAmount}';
    CURRENCY @title : '{i18n>currency}';
    TAX_AMOUNT @title : '{i18n>taxAmount}';  
} ;



