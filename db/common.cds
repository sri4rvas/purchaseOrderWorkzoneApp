namespace srini.common;

using { sap,Currency,temporal,managed  } from '@sap/cds/common';

type Gender:String(1) enum{
    male = 'M';
    femal = 'F';
    nonBinary = 'N';
    noDisclose = 'D';
    selfDescribe = 'S';
}
type AmountT:Decimal(15,2)@(
    Semantics.amount.CurrencyCode:'CURRENCY_CODE',
    sap.unit:'CURRENCY_CODE'
    );
aspect Amount{
    CURRENCY:Currency;
    GROSS_AMOUNT:AmountT;
    NET_AMOUNT:AmountT;
    TAX_AMOUNT:AmountT;
}
type PhoneNumber:String(15); //@assert.format : '/(\+\d{1,3}\s?)?((\(\d{3}\)\s?)|(\d{3})(\s|-?))(\d{3}(\s|-?))(\d{4})(\s?(([E|e]xt[:|.|]?)|x|X)(\s?\d+))?/g';
type Email:String(150); //@assert.format : '/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/';

