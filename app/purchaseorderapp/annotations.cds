using CatalogService as service from '../../srv/CatalogService';

annotate service.PurchaseOrder with @(
    UI.SelectionFields           : [
        PO_ID,
        GROSS_AMOUNT,
        LIFECYCLE_STATUS,
        CURRENCY_code
    ],
    UI.LineItem                  : [
        {
            $Type: 'UI.DataField',
            Value: PO_ID,
        },
        {
            $Type: 'UI.DataField',
            Value: GROSS_AMOUNT,
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : '{i18n>Boost}',
            Action: 'CatalogService.boost',
            Inline: true

        },
        {
            $Type: 'UI.DataField',
            Label: 'CURRENCY_code',
            Value: CURRENCY_code,
        },
        {
            $Type: 'UI.DataField',
            Value: NET_AMOUNT,
        },
        {
            $Type: 'UI.DataField',
            Value: TAX_AMOUNT,
        },
        {
            $Type: 'UI.DataField',
            Value: PARTNER_GUID.COMPANY_NAME
        },
        {
            $Type: 'UI.DataField',
            Value: PARTNER_GUID.ADDRESS_GUID.COUNTRY
        },
        {
            $Type                    : 'UI.DataField',
            Value                    : LIFECYCLE_STATUS,
            Criticality              : Criticality,
            CriticalityRepresentation: #WithIcon
        }


    ],
    UI.HeaderInfo                : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : '{i18n>PurchaseOrder}',
        TypeNamePlural: '{i18n>PurchaseOrders}',
        Title         : {
            Label: '{i18n>PurchaseOrder}',
            Value: PO_ID
        },
        Description   : {
            Label: '{i18n>Desc}',
            Value: GROSS_AMOUNT
        }

    },
    UI.Facets                    : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'GeneratedFacet1',
            Label : 'General Information',
            Target: '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'lineItemFacet1',
            Label : 'Line Items',
            Target: 'Items/@UI.LineItem'
        }
    ],

    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: PO_ID,
            },
            {
                $Type: 'UI.DataField',
                Value: PARTNER_GUID_NODE_KEY
            },
            {
                $Type: 'UI.DataField',
                Value: PARTNER_GUID.COMPANY_NAME
            },
            {
                $Type: 'UI.DataField',
                Value: GROSS_AMOUNT,
            },
            {
                $Type: 'UI.DataField',
                Label: 'CURRENCY_code',
                Value: CURRENCY_code,
            },
            {
                $Type: 'UI.DataField',
                Value: NET_AMOUNT,
            },
            {
                $Type: 'UI.DataField',
                Value: TAX_AMOUNT,
            },
            {
                $Type                    : 'UI.DataField',
                Value                    : LIFECYCLE_STATUS,
                Criticality              : Criticality,
                CriticalityRepresentation: #WithIcon
            },
            {
                $Type: 'UI.DataField',
                Value: OVERALL_STATUS,
            },
            {
                $Type: 'UI.DataField',
                Label: 'NOTE',
                Value: NOTE,
            }
        ]
    }
);

annotate service.PurchaseOrderItems with
@(UI: {
    LineItem                  : [
        {
            $Type: 'UI.DataField',
            Value: PO_ITEM_POS
        },
        {
            $Type: 'UI.DataField',
            Value: PRODUCT_GUID_NODE_KEY
        },
        {
            $Type: 'UI.DataField',
            Value: PRODUCT_GUID.PRODUCT_ID
        },
        {
            $Type: 'UI.DataField',
            Value: GROSS_AMOUNT
        },
        {
            $Type: 'UI.DataField',
            Value: CURRENCY_code
        },
        {
            $Type: 'UI.DataField',
            Value: NET_AMOUNT
        },
        {
            $Type: 'UI.DataField',
            Value: TAX_AMOUNT
        }

    ],
    HeaderInfo                : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : '{i18n>PurchaseOrderItem}',
        TypeNamePlural: '{i18n>PurchaseOrderItems}',
        Title         : {
            $Type: 'UI.DataField',
            Value: PO_ITEM_POS
        },
        Description   : {
            $Type: 'UI.DataField',
            Value: GROSS_AMOUNT
        }

    },

    Facets                    : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup',
    }],

    FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: PO_ITEM_POS,
            },
            {
                $Type: 'UI.DataField',
                Value: PRODUCT_GUID_NODE_KEY,
            },
            {
                $Type: 'UI.DataField',
                Value: PRODUCT_GUID.PRODUCT_ID,
            },
            {
                $Type: 'UI.DataField',
                Value: GROSS_AMOUNT,
            },
            {
                $Type: 'UI.DataField',
                Label: 'CURRENCY_code',
                Value: CURRENCY_code,
            },
            {
                $Type: 'UI.DataField',
                Value: NET_AMOUNT,
            },
            {
                $Type: 'UI.DataField',
                Value: TAX_AMOUNT,
            }
        ]
    }
});


annotate service.PurchaseOrder with {
    PARTNER_GUID @Common.ValueList: {
        $Type         : 'Common.ValueListType',
        CollectionPath: 'BPSet',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: PARTNER_GUID_NODE_KEY,
                ValueListProperty: 'NODE_KEY',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'BP_ROLE',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'EMAIL_ADDRESS',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'PHONE_NUMBER',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'FAX_NUMBER',
            }
        ],
    }
};

annotate service.PurchaseOrderItems with {
    PRODUCT_GUID @(Common:{
        Text : PRODUCT_GUID.DESCRIPTION, 
        ValueList: {
        $Type         : 'Common.ValueListType',
        CollectionPath: 'ProductSet',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'PRODUCT_GUID_NODE_KEY',
                ValueListProperty: 'NODE_KEY',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'DESCRIPTION',
            }
        ]
    }}

    )
}
