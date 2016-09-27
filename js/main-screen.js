var kcJSON = require('../js/KanColle-JSON-DB.js');
var Ship = require('../js/ship.js');

var currentFleet = {};

function updateFleetShip(slotNum) {
	var shipSelector = document.getElementById("flt-sel-"+slotNum.toString());
	var modelSelector = document.getElementById("flt-model-"+slotNum.toString());

	var shipID = shipSelector.value;

	currentFleet[slotNum] = new Ship(shipID);

	var models = currentFleet[slotNum].getRemodels();

	while(modelSelector.hasChildNodes()) {
		modelSelector.removeChild(modelSelector.lastChild);
	}

	for (var i = 0; i < models.length; i++) {
		var opt = document.createElement('option');
		opt.value = models[i].id;
		opt.text = kcJSON.ships.getSuffixText(models[i].name.suffix);

		modelSelector.appendChild(opt);
	}
}

function populateFleetSelector() {
	var fltsel = document.getElementsByClassName("flt-sel");

	console.log("Got " + fltsel.length + " fleet selectors");

	var typeCollections = kcJSON.ships.getShipCollections();
	var baseShips = kcJSON.ships.getBaseShips();

	console.log("Got " + baseShips.length + " base ships.");

	var shipTypes = {};

	for (var i = 0; i < baseShips.length; i++) {
		if(!shipTypes.hasOwnProperty(baseShips[i].type)) {
			shipTypes[baseShips[i].type] = [];
		}
		shipTypes[baseShips[i].type].push(baseShips[i]);
	}

	var groups = [];
	for (var i = 0; i < typeCollections.length; i++) {
		var group = {};
		group.label = typeCollections[i].name.english;
		group.options = [];

		var cur = [];
		for (var i2 = 0; i2 < typeCollections[i].types.length; i2++) {
			if(shipTypes.hasOwnProperty(typeCollections[i].types[i2])) {
				cur = cur.concat(shipTypes[typeCollections[i].types[i2]]);
			}
		}

		for (var i2 = 0; i2 < cur.length; i2++) {
			group.options.push({
				"label": cur[i2].name.english,
				"value": cur[i2].id
			});
		}

		groups.push(group);
	}

	for (var i = 0; i < fltsel.length; i++) {
		var item = fltsel.item(i);

		for (var i2 = 0; i2 < groups.length; i2++) {
			var group = groups[i2];

			if(group.options.length == 0)
				continue;

			var optGroup = document.createElement('optgroup');
			optGroup.label = group.label;

			for (var i3 = 0; i3 < group.options.length; i3++) {
				var opt = document.createElement('option');
				opt.value = group.options[i3].value;
				opt.label = group.options[i3].label;

				optGroup.appendChild(opt);
			}

			item.appendChild(optGroup);
		}
	}
}

window.onload = function() {
	populateFleetSelector();

	var fltsel = document.getElementsByClassName("flt-sel");
	for (var i = 0; i < fltsel.length; i++) {
		(function(item, n) {
			item.onchange = function() { updateFleetShip(n+1); };
		})(fltsel.item(i), i);
		updateFleetShip(i+1);
	}
}
