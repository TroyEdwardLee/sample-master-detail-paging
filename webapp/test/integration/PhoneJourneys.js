/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"sample/master/detail/sample-master-detail-paging/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"sample/master/detail/sample-master-detail-paging/test/integration/pages/App",
	"sample/master/detail/sample-master-detail-paging/test/integration/pages/Browser",
	"sample/master/detail/sample-master-detail-paging/test/integration/pages/Master",
	"sample/master/detail/sample-master-detail-paging/test/integration/pages/Detail",
	"sample/master/detail/sample-master-detail-paging/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "sample.master.detail.sample-master-detail-paging.view."
	});

	sap.ui.require([
		"sample/master/detail/sample-master-detail-paging/test/integration/NavigationJourneyPhone",
		"sample/master/detail/sample-master-detail-paging/test/integration/NotFoundJourneyPhone",
		"sample/master/detail/sample-master-detail-paging/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});