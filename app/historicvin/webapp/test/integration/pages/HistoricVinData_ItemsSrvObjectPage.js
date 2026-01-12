sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'historicvin',
            componentId: 'HistoricVinData_ItemsSrvObjectPage',
            contextPath: '/historicvindata_HeaderSrv/items'
        },
        CustomPageDefinitions
    );
});