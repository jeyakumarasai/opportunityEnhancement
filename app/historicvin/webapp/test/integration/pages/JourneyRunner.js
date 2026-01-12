sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"historicvin/test/integration/pages/historicvindata_HeaderSrvList",
	"historicvin/test/integration/pages/historicvindata_HeaderSrvObjectPage",
	"historicvin/test/integration/pages/HistoricVinData_ItemsSrvObjectPage"
], function (JourneyRunner, historicvindata_HeaderSrvList, historicvindata_HeaderSrvObjectPage, HistoricVinData_ItemsSrvObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('historicvin') + '/test/flp.html#app-preview',
        pages: {
			onThehistoricvindata_HeaderSrvList: historicvindata_HeaderSrvList,
			onThehistoricvindata_HeaderSrvObjectPage: historicvindata_HeaderSrvObjectPage,
			onTheHistoricVinData_ItemsSrvObjectPage: HistoricVinData_ItemsSrvObjectPage
        },
        async: true
    });

    return runner;
});

