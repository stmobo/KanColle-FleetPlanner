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

var emptySlotLabel = "<Empty Slot>";

function updateStatsForShip(slotNum) {
	var statRow = document.getElementById("fleetStats").rows[slotNum*2];
	var level = document.getElementById("flt-lvl-"+slotNum).value;

	var stats = currentFleet[slotNum].selected.getCurrentStats(level);
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

	var statRow2 = document.getElementById("fleetStats").rows[(slotNum*2)+1];

	statRow2.cells[0].innerHTML = "0";		// Anti-installation bonuses
	statRow2.cells[1].innerHTML = "0";		// Night attack power

	// Cell 3: AACI
	var aaciType = currentFleet[slotNum].selected.getAACI();
	if(aaciType > 0) {
		statRow2.cells[2].innerHTML = "<span class=\"hasAACI\">" +
		"Type " + aaciType + " (" + kcJSON.ships.getAACIShootdown(aaciType) + ")"
		+ "<\/span>"
	} else {
		statRow2.cells[2].innerHTML = "<span class=\"noAACI\">No<\/span>";
	}

	// Cell 4: OASW
	if(currentFleet[slotNum].selected.canOASW(level)) {
		statRow2.cells[3].innerHTML = "<span class=\"hasOASW\">Yes<\/span>";	// OASW
	} else {
		statRow2.cells[3].innerHTML = "<span class=\"noOASW\">No<\/span>";
	}
	statRow2.cells[4].innerHTML = "0 ~ 0";	// Opening Airstrike power
	statRow2.cells[5].innerHTML = "0 ~ 0";	// Fighter power

	// Cell 5: Artillery Spotting
	var artSpotType = currentFleet[slotNum].selected.getArtillerySpotting();
	if(artSpotType > 0) {
		var asText = "";
		switch(artSpotType) {
			case 1: asText = "Double Attack"; break;
			case 2: asText = "Sec. Gun Cut-In"; break;
			case 3: asText = "Radar Cut-In"; break;
			case 4: asText = "AP Shell Cut-In"; break;
			case 5: asText = "AP Shell CI + DA"; break;
			case 6: asText = "Sec. Gun CI + DA"; break;
			default: asText = ""; break;
		}
		statRow2.cells[6].innerHTML = "<span class=\"hasSpotting\">"+asText+"<\/span>";
	} else {
		statRow2.cells[6].innerHTML = "<span class=\"noSpotting\">No<\/span>";
	}


	statRow2.cells[7].innerHTML =
		"Fuel: " + currentFleet[slotNum].selected.consum.fuel +
		" Ammo: " + currentFleet[slotNum].selected.consum.ammo;

	for (var i = 1; i <= currentFleet[slotNum].selected.equip.length; i++) {
		var hangarElem = document.getElementById("flt-hangar-"+slotNum+"-"+i);
		hangarElem.innerHTML = currentFleet[slotNum].selected.slot[i-1];
	}

	document.getElementById("flt-type-"+slotNum).innerHTML = currentFleet[slotNum].selected.getTypeInfo().code;
}

function clearShipStats(slotNum) {
	var statRow = document.getElementById("fleetStats").rows[slotNum*2];

	statRow.cells[1].textContent = emptySlotLabel;
	statRow.cells[2].innerHTML = "";

	statRow.cells[3].innerHTML = "";
	statRow.cells[4].innerHTML = "";
	statRow.cells[5].innerHTML = "";
	statRow.cells[6].innerHTML = "";
	statRow.cells[7].innerHTML = "";

	statRow.cells[8].innerHTML = "";
	statRow.cells[9].innerHTML =  "";
	statRow.cells[10].innerHTML = "";
	statRow.cells[11].innerHTML = "";
	statRow.cells[12].innerHTML = "";

	var statRow2 = document.getElementById("fleetStats").rows[(slotNum*2)+1];

	statRow2.cells[0].innerHTML = "";
	statRow2.cells[1].innerHTML = "";
	statRow2.cells[2].innerHTML = "";
	statRow2.cells[3].innerHTML = "";
	statRow2.cells[4].innerHTML = "";
	statRow2.cells[5].innerHTML = "";
	statRow2.cells[6].innerHTML = "";
	statRow2.cells[7].innerHTML = "";
}

function updateItemSelectors(slotNum) {
	var equipTypes = currentFleet[slotNum].selected.getEquippableItemTypes();

	var optGroups = [];

	for (var i = 0; i < equipTypes.length; i++) {
		var typeData = kcJSON.items.getTypeDataByID(equipTypes[i]);
		var group = document.createElement("optgroup");

		group.label = typeData.name.english;

		var items = kcJSON.items.getAllItemsOfType(equipTypes[i]);
		for(var i2 = 0; i2 < items.length; i2++) {
			var option = document.createElement("option");
			option.value = items[i2].id;
			option.label = items[i2].name.english;
			group.appendChild(option);
		}

		optGroups.push(group);
	}

	for (var i = 1; i <= currentFleet[slotNum].selected.getMaxEquipSlot(); i++) {
		var itemSel = document.getElementById("flt-itm-"+slotNum+"-"+i);

		while(itemSel.hasChildNodes()) {
			itemSel.removeChild(itemSel.lastChild);
		}

		for (var i2 = 0; i2 < optGroups.length; i2++) {
			itemSel.appendChild(optGroups[i2].cloneNode(true));
		}

		var deSel= document.createElement("option");
		deSel.value = null;
		deSel.label = emptySlotLabel;
		itemSel.appendChild(deSel);

		itemSel.disabled = false;
	}

	for(var i=currentFleet[slotNum].selected.getMaxEquipSlot()+1; i<=4; i++) {
		var itemSel = document.getElementById("flt-itm-"+slotNum+"-"+i);

		while(itemSel.hasChildNodes()) {
			itemSel.removeChild(itemSel.lastChild);
		}

		itemSel.disabled = true;
	}
}

function setDefaultSelectedItems(slotNum) {
	for(var i=1; i<=currentFleet[slotNum].selected.getMaxEquipSlot(); i++) {
		var itemSel = document.getElementById("flt-itm-"+slotNum+"-"+i);

		if(currentFleet[slotNum].selected.currentEquipment[i-1] != null) {
			var currentID = currentFleet[slotNum].selected.currentEquipment[i-1].id;

			for (var i2 = 0; i2 < itemSel.options.length; i2++) {
				if(itemSel.options[i2].value == currentID) {
					itemSel.selectedIndex = i2;
					break;
				}
			}
		} else {
			for (var i2 = 0; i2 < itemSel.options.length; i2++) {
				if(itemSel.options[i2].label === emptySlotLabel) {
					itemSel.selectedIndex = i2;
					break;
				}
			}
		}
	}
}

function newBaseShipSelected(slotNum) {
	var shipSelector = document.getElementById("flt-sel-"+slotNum);
	var modelSelector = document.getElementById("flt-model-"+slotNum);

	if(shipSelector.options[shipSelector.selectedIndex].label === emptySlotLabel) {
		/* Disable the other parts of the slot. */
		modelSelector.disabled = true;
		document.getElementById("flt-lvl-"+slotNum).disabled = true;

		while(modelSelector.hasChildNodes()) {
			modelSelector.removeChild(modelSelector.lastChild);
		}

		for(var i=1;i<=4;i++) {
			var itemSelector = document.getElementById("flt-itm-"+slotNum+"-"+i);

			while(itemSelector.hasChildNodes()) {
				itemSelector.removeChild(itemSelector.lastChild);
			}

			itemSelector.disabled = true;

			var hangarElem = document.getElementById("flt-hangar-"+slotNum+"-"+i);
			hangarElem.innerHTML = "";
		}

		document.getElementById("flt-type-"+slotNum).innerHTML = "";

		currentFleet[slotNum].base = null;
		currentFleet[slotNum].selected = null;

		clearShipStats(slotNum);

		return;
	}

	modelSelector.disabled = false;

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

	var levelSelector = document.getElementById("flt-lvl-"+slotNum);
	levelSelector.value = currentFleet[slotNum].selected.base_lvl;
	levelSelector.disabled = false;

	updateStatsForShip(slotNum);
	updateItemSelectors(slotNum);

	setDefaultSelectedItems(slotNum);
}

function updateShipModel(slotNum) {
	var modelSelector = document.getElementById("flt-model-"+slotNum);
	var modelID = modelSelector.value;
	currentFleet[slotNum].selected = new Ship(modelID);

	document.getElementById("flt-lvl-"+slotNum).value
		= currentFleet[slotNum].selected.base_lvl;

	updateStatsForShip(slotNum);
	updateItemSelectors(slotNum);

	setDefaultSelectedItems(slotNum);
}

function updateShipItem(slotNum, itemNum) {
	var itemSelector = document.getElementById("flt-itm-"+slotNum+"-"+itemNum);

	if(itemSelector.options[itemSelector.selectedIndex].label == emptySlotLabel) {
		currentFleet[slotNum].selected.unequipItem(itemNum-1);
	} else {
		currentFleet[slotNum].selected.equipItem(
			itemNum-1,
			kcJSON.items.getItemByID(itemSelector.value)
		);
	}

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

		var deSel= document.createElement("option");
		deSel.value = null;
		deSel.label = emptySlotLabel;
		item.appendChild(deSel);
	}
}

window.onload = function() {
	populateFleetSelector();

	for (var i = 1; i <= 6; i++) {
		(function(n) {
			var sel = document.getElementById("flt-sel-"+n);
			var mdl = document.getElementById("flt-model-"+n);
			var lvl = document.getElementById("flt-lvl-"+n);

			sel.onchange = function() { newBaseShipSelected(n); };
			mdl.onchange = function() { updateShipModel(n); };
			lvl.onchange = function() { updateStatsForShip(n); };

			document.getElementById("flt-itm-"+n+"-1").onchange = function() { updateShipItem(n, 1); };
			document.getElementById("flt-itm-"+n+"-2").onchange = function() { updateShipItem(n, 2); };
			document.getElementById("flt-itm-"+n+"-3").onchange = function() { updateShipItem(n, 3); };
			document.getElementById("flt-itm-"+n+"-4").onchange = function() { updateShipItem(n, 4); };
		})(i);

		newBaseShipSelected(i);
	}
}
