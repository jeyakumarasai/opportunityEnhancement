sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'vnlog',
            componentId: 'vinSuccessSrvObjectPage',
            contextPath: '/vinHeaderSrv/items_success'
        },
        CustomPageDefinitions
    );
});