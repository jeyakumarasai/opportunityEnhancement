sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onThehistoricvindata_HeaderSrvList.iSeeThisPage();

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onThehistoricvindata_HeaderSrvList.onFilterBar().iExecuteSearch();
            
            Then.onThehistoricvindata_HeaderSrvList.onTable().iCheckRows();

            When.onThehistoricvindata_HeaderSrvList.onTable().iPressRow(0);
            Then.onThehistoricvindata_HeaderSrvObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});