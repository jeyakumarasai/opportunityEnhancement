sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'historicvin',
            componentId: 'historicvindata_HeaderSrvList',
            contextPath: '/historicvindata_HeaderSrv'
        },
        CustomPageDefinitions
    );
});