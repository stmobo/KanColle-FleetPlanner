var kcJSON = require('../js/KanColle-JSON-DB.js');

function updateFleet() {
	console.log('updatefleet called');

	for(var slotNum=1;slotNum<=6;slotNum++) {
		var shipSelector = document.getElementById("flt-sel-"+slotNum.toString());
		var modelSelector = document.getElementById("flt-model-"+slotNum.toString());

		var shipID = shipSelector.value;
		var models = kcJSON.ships.getRemodelsForShip(shipID);

		while(modelSelector.hasChildNodes()) {
			modelSelector.removeChild(modelSelector.lastChild);
		}

		for (var i = 0; i < models.length; i++) {
			var opt = document.createElement('option');
			opt.value = models[i].id;
			opt.text = models[i].suffix;

			modelSelector.appendChild(opt);
		}
	}
}

function populateFleetSelector() {
	var fltsel = document.getElementsByClassName("flt-sel");

	console.log("Got " + fltsel.length + " fleet selectors");

	var names = kcJSON.ships.getEnglishNameList();

	for (var i = 0; i < fltsel.length; i++) {
		var sel = fltsel.item(i);

		for (var i2 = 0; i2 < names.length; i2++) {
			var opt = document.createElement('option');
			opt.value = names[i2].id;
			opt.text = names[i2].name;

			sel.appendChild(opt);
		}
	}
}

window.onload = function() {
	populateFleetSelector();

	var fltsel = document.getElementsByClassName("flt-sel");
	for (var i = 0; i < fltsel.length; i++) {
		var sel = fltsel.item(i);
		sel.onchange = updateFleet;
	}
}
