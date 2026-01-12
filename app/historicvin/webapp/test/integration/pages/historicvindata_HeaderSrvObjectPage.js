sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'historicvin',
            componentId: 'historicvindata_HeaderSrvObjectPage',
            contextPath: '/historicvindata_HeaderSrv'
        },
        CustomPageDefinitions
    );
});