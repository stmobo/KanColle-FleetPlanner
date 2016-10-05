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
	$(".secTab").removeClass().addClass("secTab");
	$(".infoSection").css("display", "none");

	$("#"+tab+"Tab").removeClass().addClass("selectedSecTab");
	$("#"+tab+"Section").css("display", "block");
}

$(function(){
	for (var i = 0; i < tabs.length; i++) {
		(function(t) {
			$("#"+t+"Tab").click(function() { showTab(t); });
		})(tabs[i]);
	}
})
