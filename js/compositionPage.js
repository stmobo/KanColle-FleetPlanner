/*
* Handles the composition page as a whole (tabs, fleet/item selector, etc.)
* Should only be included from index.html (or wherever the fleet composition / loadout page is!)
*/

var app = require('electron').remote.app;
var path = require('path');
var $ = require('jquery');

var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Fleet = require(path.join(app.getAppPath(), '/js/fleet.js'));

var currentFleet = new Fleet();

var tabs = ["fleetStats", "fleetInfo", "fleetConsum"];

function showTab(tab) {
	for (var i = 0; i < tabs.length; i++) {
		document.getElementById(tabs[i]+"Tab").className = "secTab";
		document.getElementById(tabs[i]+"Section").style.display = "none";
	}

	document.getElementById(tab+"Tab").className = "selectedSecTab";
	document.getElementById(tab+"Section").style.display = "block";
}

window.addEventListener("load", function() {
	populateFleetSelector();

	for (var i = 1; i <= 6; i++) {
		(function(n) {
			var sel = document.getElementById("flt-sel-"+n);
			var mdl = document.getElementById("flt-model-"+n);
			var lvl = document.getElementById("flt-lvl-"+n);

			sel.addEventListener("change", function() { newBaseShipSelected(n); updateFleetInfoTab(); });
			mdl.addEventListener("change", function() { updateShipModel(n); updateFleetInfoTab(); });
			lvl.addEventListener("change", function() { updateStatsForShip(n); updateFleetInfoTab(); });

			document.getElementById("flt-itm-"+n+"-1").addEventListener("change", function() { updateShipItem(n, 1); updateFleetInfoTab(); });
			document.getElementById("flt-itm-"+n+"-2").addEventListener("change", function() { updateShipItem(n, 2); updateFleetInfoTab(); });
			document.getElementById("flt-itm-"+n+"-3").addEventListener("change", function() { updateShipItem(n, 3); updateFleetInfoTab(); });
			document.getElementById("flt-itm-"+n+"-4").addEventListener("change", function() { updateShipItem(n, 4); updateFleetInfoTab(); });
		})(i);

		newBaseShipSelected(i);
	}

	updateFleetInfoTab();

	for (var i = 0; i < tabs.length; i++) {
		(function(t) {
			var tab = document.getElementById(t+"Tab");
			tab.addEventListener("click", function() { showTab(t); });
		})(tabs[i]);
	}
});
