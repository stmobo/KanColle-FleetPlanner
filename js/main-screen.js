var kcJSON = require('../js/KanColle-JSON-DB.js');
var Ship = require('../js/ship.js');

var currentFleet = {};

/*
 Fleet member objects:
{
	 "base": base ship selected
	 "models": array of remodels for base ship
	 "selected": model selected of base
}
 */

/* Slot numbers start at 1 and go to 6. */

function updateStatsForShip(slotNum) {
	var statRow = document.getElementById("fleetStats").rows[slotNum];
	var level = document.getElementById("flt-lvl-"+slotNum).value;

	var stats = currentFleet[slotNum].selected.estimateStatsAtLevel(level);
	statRow.cells[1].innerHTML = currentFleet[slotNum].selected.getFullName();
	statRow.cells[2].innerHTML = stats.hp;

	statRow.cells[3].innerHTML = stats.fire;
	statRow.cells[4].innerHTML = stats.torpedo;
	statRow.cells[5].innerHTML = stats.aa;
	statRow.cells[6].innerHTML = stats.armor;
	statRow.cells[7].innerHTML = stats.asw;

	statRow.cells[8].innerHTML = stats.evasion;
	statRow.cells[9].innerHTML = stats.los;
	statRow.cells[10].innerHTML = stats.luck;
	statRow.cells[11].innerHTML = currentFleet[slotNum].selected.getSpeedString();
	statRow.cells[12].innerHTML = currentFleet[slotNum].selected.getRangeString();
}

function newBaseShipSelected(slotNum) {
	var shipSelector = document.getElementById("flt-sel-"+slotNum);
	var modelSelector = document.getElementById("flt-model-"+slotNum);
	var baseID = shipSelector.value;

	currentFleet[slotNum] = {
		"base": new Ship(baseID),
	};

	var models = currentFleet[slotNum].base.getRemodels();
	currentFleet[slotNum].selected = currentFleet[slotNum].base;

	while(modelSelector.hasChildNodes()) {
		modelSelector.removeChild(modelSelector.lastChild);
	}

	for (var i = 0; i < models.length; i++) {
		var opt = document.createElement('option');
		opt.value = models[i].id;
		opt.text = kcJSON.ships.getSuffixText(models[i].name.suffix);

		modelSelector.appendChild(opt);
	}

	document.getElementById("flt-lvl-"+slotNum).value
		= currentFleet[slotNum].selected.base_lvl;

	updateStatsForShip(slotNum);
}

function updateShipModel(slotNum) {
	var modelSelector = document.getElementById("flt-model-"+slotNum);
	var modelID = modelSelector.value;
	currentFleet[slotNum].selected = new Ship(modelID);

	document.getElementById("flt-lvl-"+slotNum).value
		= currentFleet[slotNum].selected.base_lvl;

	updateStatsForShip(slotNum);
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

	for (var i = 1; i <= 6; i++) {
		var sel = document.getElementById("flt-sel-"+i);
		var mdl = document.getElementById("flt-model-"+i);
		var lvl = document.getElementById("flt-lvl-"+i);

		(function(s, l, m, n) {
			s.onchange = function() { newBaseShipSelected(n); };
			l.onchange = function() { updateStatsForShip(n); };
			m.onchange = function() { updateShipModel(n); };
		})(sel, lvl, mdl, i);

		newBaseShipSelected(i);
	}
}
