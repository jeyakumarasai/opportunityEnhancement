using vinlogService as service from '../../srv/vinlog-srv';
annotate service.vinHeaderSrv with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Opportunity ID',
                Value : opportunityID,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
          $Type  : 'UI.ReferenceFacet',
          Label  : 'Vin Success',
          Target : 'items_success/@UI.LineItem'
    },
       {
         $Type  : 'UI.ReferenceFacet',
         Label  : 'Vin Failure',
         Target : 'items_failure/@UI.LineItem'
    },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Opportunity ID',
            Value : opportunityID,
        },
    ],
    UI.DeleteHidden : true,
);

annotate vinlogService.vinSuccessSrv with @(
    UI.CreateHidden : false,
    UI.DeleteHidden : false,
    Capabilities.InsertRestrictions : {  Insertable : true     },
    Capabilities.DeleteRestrictions : {  Deletable  : true      },
   
    UI.LineItem: [
        { Value: vinID,         $Type : 'UI.DataField',  Label : '{i18n>vinID}',           Position: 10 },
      //  { Value: productID,     $Type : 'UI.DataField',  Label : '{i18n>productID}',       Position: 20 },
       // { Value: product_Desc,  $Type : 'UI.DataField',  Label : '{i18n>product_Desc}',    Position: 30 },
      //  { Value: customerID,    $Type : 'UI.DataField',  Label : '{i18n>customerID}',      Position: 40 },
        { Value: make_OE,       $Type : 'UI.DataField',  Label : '{i18n>make_OE}',         Position: 50 },
        { Value: model,         $Type : 'UI.DataField',  Label : '{i18n>model}',           Position: 60 },
        { Value: year,          $Type : 'UI.DataField',  Label : '{i18n>year}',            Position: 70 },
        { Value: dateTime,      $Type : 'UI.DataField',  Label : '{i18n>dateTime}',        Position: 80 },
        { Value: duplicate,     $Type : 'UI.DataField',  Label : '{i18n>duplicate}',       Position: 90 },
        
    ],

   UI.SelectionFields: [
    vinID,
   // productID,
    customerID,
    model,
    year,
    duplicate,
    make_OE,
    dateTime
  ],
    Communication.Contact #contact : {
        $Type : 'Communication.ContactType',
        fn : vinID,
    },
) ;



annotate vinlogService.vinFailureSrv with @(  

    UI.DeleteHidden : false,
    Capabilities.InsertRestrictions : {  Insertable : false    },
    Capabilities.DeleteRestrictions : {  Deletable  : true      },
    UI.LineItem: [      
    //     {
    // $Type  : 'UI.DataFieldForAction',
    // Action : 'vinlogService.vinFailureSrv/delete',
    // Label  : 'Remove',
    // Inline : false
    // },
    { Value: vinID,        Position: 10 },
   // { Value: productID,    Position: 20 },
   // { Value: customerID,   Position: 30 },
    { Value: make_OE,      Position: 40 },
    { Value: model,        Position: 50 },
    { Value: year,         Position: 60 },
    { Value: dateTime,     Position: 70 },
    { Value: duplicate,    Position: 80 },
    { Value: errorMessage, Position: 90 },
  ]

 
   

) ;

annotate vinlogService.uploadCSV with @Common.SideEffects: {
  TargetProperties: [
    'items_success',
    'items_failure'
  ]
};



