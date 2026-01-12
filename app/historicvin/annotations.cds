using vinlogService as service from '../../srv/vinlog-srv';

annotate service.historicvindata_HeaderSrv with @(
    UI.LineItem           : [{
        Value   : opportunityID,
        Position: 10
    }, ],
    UI.Facets             : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'General Information',
            Target: '@UI.FieldGroup#General',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Items',
            Target: 'items/@UI.LineItem',
        },

    ],
    UI.FieldGroup #General: {Data: [{Value: opportunityID}]}


);

annotate service.HistoricVinData_ItemsSrv with @(UI.LineItem: [
    {
        Value   : customerID,
        Position: 10
    },
    {
        Value   : customerID,
        Position: 10
    },
    {
        Value   : vinID,
        Position: 20
    },
    {
        Value   : productID,
        Position: 30
    },
    {
        Value   : product_Desc,
        Position: 40
    },
    {
        Value   : make_OE,
        Position: 50
    },
    {
        Value   : model,
        Position: 60
    },
    {
        Value   : year,
        Position: 70
    },
]);
