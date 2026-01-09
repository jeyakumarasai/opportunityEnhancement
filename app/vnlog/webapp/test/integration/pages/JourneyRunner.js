sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"vnlog/test/integration/pages/vinHeaderSrvList",
	"vnlog/test/integration/pages/vinHeaderSrvObjectPage",
	"vnlog/test/integration/pages/vinSuccessSrvObjectPage"
], function (JourneyRunner, vinHeaderSrvList, vinHeaderSrvObjectPage, vinSuccessSrvObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('vnlog') + '/test/flp.html#app-preview',
        pages: {
			onThevinHeaderSrvList: vinHeaderSrvList,
			onThevinHeaderSrvObjectPage: vinHeaderSrvObjectPage,
			onThevinSuccessSrvObjectPage: vinSuccessSrvObjectPage
        },
        async: true
    });

    return runner;
});

