var app = require('electron').remote.app;
var path = require('path');
var $ = require('jquery');

var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Fleet = require(path.join(app.getAppPath(), '/js/fleet.js'));

/*
 * Fleet info tab:
 */
function updateFleetInfoTab(fleet) {
	var fighterPower = fleet.getFighterPower();
	document.getElementById("fleetInfo-FighterPower").textContent
		= fighterPower.min + " ~ " + fighterPower.max;

	document.getElementById("fleetInfo-Speed").textContent = (fleet.isFast() ? "Fast" : "Slow");

	document.getElementById("fleetInfo-Level").textContent = fleet.getCombinedLevel();

	var rsc = fleet.getConsumption();
	document.getElementById("fleetInfo-ammoConsum").textContent = rsc.ammo;
	document.getElementById("fleetInfo-fuelConsum").textContent = rsc.fuel;

	document.getElementById("fleetInfo-TLOS").textContent = fleet.getSimpleLOS();

	document.getElementById("fleetInfo-Notation").textContent = fleet.getShorthand();

	var canBeEscort = fleet.canBeNormalEscort();
	var canBeSTFMain = fleet.canBeSTFMain();
	var canBeCTFMain = fleet.canBeCTFMain();
	var canBeTECFEscort = fleet.canBeTECFEscort();
	var canBeTECFMain = fleet.canBeTECFMain();

	var stfDisplay = document.getElementById("fleetInfo-STF");
	if(canBeSTFMain && canBeEscort) {
		stfDisplay.textContent = "Main / Escort Fleet";
		stfDisplay.className = "hasValue";
	} else if(canBeSTFMain && !canBeEscort) {
		stfDisplay.textContent = "Main Fleet";
		stfDisplay.className = "hasValue";
	} else if(canBeEscort && !canBeSTFMain) {
		stfDisplay.textContent = "Escort Fleet";
		stfDisplay.className = "hasValue";
	} else {
		stfDisplay.textContent = "No";
		stfDisplay.className = "noValue";
	}

	var ctfDisplay = document.getElementById("fleetInfo-CTF");
	if(canBeCTFMain && canBeEscort) {
		ctfDisplay.textContent = "Main / Escort Fleet";
		ctfDisplay.className = "hasValue";
	} else if(canBeCTFMain && !canBeEscort) {
		ctfDisplay.textContent = "Main Fleet";
		ctfDisplay.className = "hasValue";
	} else if(canBeEscort && !canBeCTFMain) {
		ctfDisplay.textContent = "Escort Fleet";
		ctfDisplay.className = "hasValue";
	} else {
		ctfDisplay.textContent = "No";
		ctfDisplay.className = "noValue";
	}

	var tecfDisplay = document.getElementById("fleetInfo-TECF");
	if(canBeTECFMain && canBeTECFEscort) {
		tecfDisplay.textContent = "Main / Escort Fleet";
		tecfDisplay.className = "hasValue";
	} else if(canBeTECFMain && !canBeTECFEscort) {
		tecfDisplay.textContent = "Main Fleet";
		tecfDisplay.className = "hasValue";
	} else if(canBeTECFEscort && !canBeTECFMain) {
		tecfDisplay.textContent = "Escort Fleet";
		tecfDisplay.className = "hasValue";
	} else {
		tecfDisplay.textContent = "No";
		tecfDisplay.className = "noValue";
	}
}
