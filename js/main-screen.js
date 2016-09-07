var kcJSON = require('../js/KanColle-JSON-DB.js');

function populateFleetSelector() {
	var fltsel = document.getElementsByClassName("flt-sel");

	console.log("Got " + fltsel.length + " fleet selectors");

	var names = kcJSON.ships.getEnglishNames();

	for (var i = 0; i < fltsel.length; i++) {
		var sel = fltsel.item(i);

		for (var i2 = 0; i2 < names.length; i2++) {
			var opt = document.createElement('option');
			opt.value = names[i2];
			opt.text = names[i2];

			sel.appendChild(opt);
		}
	}
}

window.onload = populateFleetSelector;
