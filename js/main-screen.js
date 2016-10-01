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

/*
 * Fleet and Item Selectors:
 */

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

		var hangarElem = document.getElementById("flt-hangar-"+slotNum+"-"+i);
		hangarElem.innerHTML = "";
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

/*
 * Stats Breakdown View:
 */

function updateStatsForShip(slotNum) {
	var statRow = document.getElementById("fleetStats").rows[slotNum*2];
	var level = Number(document.getElementById("flt-lvl-"+slotNum).value);

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

	// Cell 1: Anti-Installation Attack Power
	var antiInstall = currentFleet[slotNum].selected.getInstallationAttack(level);
	statRow2.cells[0].textContent = "D: " + antiInstall.day + " / N: " + antiInstall.night;

	// Cell 2: Night Attack Power
	if(currentFleet[slotNum].selected.getNBCI()) {
		var natk = stats.fire + stats.torpedo;
		natk = Math.floor(natk * 1.5);
		if(natk > 300) {
			natk = Math.floor(300 + Math.sqrt(natk - 300));
		}
		statRow2.cells[1].textContent =
		currentFleet[slotNum].selected.getNightAttack(level) +
		" ~ " + natk;
	} else {
		statRow2.cells[1].textContent = currentFleet[slotNum].selected.getNightAttack(level);
	}


	// Cell 3: AACI
	var aaciType = currentFleet[slotNum].selected.getAACI();
	if(aaciType > 0) {
		statRow2.cells[2].textContent = "Type " + aaciType + " (+" + kcJSON.ships.getAACIShootdown(aaciType) + ")";
		statRow2.cells[2].className = "hasValue";
	} else {
		statRow2.cells[2].textContent = "No";
		statRow2.cells[2].className = "noValue";
	}

	// Cell 4: OASW
	if(currentFleet[slotNum].selected.canOASW(level)) {
		statRow2.cells[3].textContent = "Yes";
		statRow2.cells[3].className = "hasValue";
	} else {
		statRow2.cells[3].textContent = "No";
		statRow2.cells[3].className = "noValue";
	}

	// Cell 5: Opening Airstrike
	var oas = currentFleet[slotNum].selected.getOpeningAirstrike();
	statRow2.cells[4].innerHTML = oas.min + " ~ " + oas.max;

	// Cell 6: Fighter power
	var fp = currentFleet[slotNum].selected.getFighterPower();
	statRow2.cells[5].innerHTML = fp.min + " ~ " + fp.max;

	// Cell 7: Artillery Spotting
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
			default: asText = "Unknown"; break;
		}
		statRow2.cells[6].textContent = asText;
		statRow2.cells[6].className = "hasValue";
	} else if(currentFleet[slotNum].selected.getNBCI()) {
		statRow2.cells[6].textContent = "Night Battle Cut-In";
		statRow2.cells[6].className = "hasValue";
	} else {
		statRow2.cells[6].textContent = "No";
		statRow2.cells[6].className = "noValue";
	}


	// Cell 8: Resource consumption
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

/*
 * Fleet info tab:
 */

function getFleetCodeCount() {
	var counts = {};
	for (var id in kcJSON.ships.shipTypes) {
		if (kcJSON.ships.shipTypes.hasOwnProperty(id)) {
			var code = kcJSON.ships.shipTypes[id].code;
			if(!counts.hasOwnProperty(code))
				counts[code] = 0;
		}
	}

	for (var i = 1; i <= 6; i++) {
		if(currentFleet[i].selected == null)
			continue;

		var typeInfo = currentFleet[i].selected.getTypeInfo();
		counts[typeInfo.code] += 1;
	}

	return counts;
}

function getNShipsInFleet() {
	var n = 0;

	for(var i=1;i<=6;i++) {
		if(currentFleet[i].selected == null)
			continue;
		n += 1;
	}

	return n;
}

function updateFleetInfoTab() {
	var fighterPower = { "min": 0, "max":0 };
	var isSlow = false;
	var combinedLevel = 0;
	var combinedLOS = 0; // Simple los
	var rsc = { "ammo": 0, "fuel": 0 };
	var noCodes = {};

	for(var i=1;i<=6;i++) {
		if(currentFleet[i].selected == null)
			continue;

		var shipLevel =  Number(document.getElementById("flt-lvl-"+i).value);
		var shipStats = currentFleet[i].selected.getCurrentStats(shipLevel);

		var shipFP = currentFleet[i].selected.getFighterPower();
		fighterPower.min += shipFP.min;
		fighterPower.max += shipFP.max;

		if(currentFleet[i].selected.stat.speed == 5)
			isSlow = true;

		combinedLevel += shipLevel;
		combinedLOS += shipStats.los;
		rsc.ammo += currentFleet[i].selected.consum.ammo;
		rsc.fuel += currentFleet[i].selected.consum.fuel;

		var typeInfo = currentFleet[i].selected.getTypeInfo();
		if(!noCodes.hasOwnProperty(typeInfo.code)) {
			noCodes[typeInfo.code] = 1;
		} else {
			noCodes[typeInfo.code] += 1;
		}
	}

	// fighter power
	document.getElementById("fleetInfo-FighterPower").textContent
		= fighterPower.min + " ~ " + fighterPower.max;

	document.getElementById("fleetInfo-Speed").textContent = (isSlow ? "Slow" : "Fast");

	document.getElementById("fleetInfo-Level").textContent = combinedLevel;

	document.getElementById("fleetInfo-ammoConsum").textContent = rsc.ammo;
	document.getElementById("fleetInfo-fuelConsum").textContent = rsc.fuel;

	document.getElementById("fleetInfo-TLOS").textContent = combinedLOS;

	var shorthand = "";
	for (var code in noCodes) {
		if (noCodes.hasOwnProperty(code)) {
			shorthand += noCodes[code] + code;
		}
	}
	document.getElementById("fleetInfo-Notation").textContent = shorthand;

	var fleetCodes = getFleetCodeCount();

	var canBeSTFMain = false;
	var canBeCTFMain = false;
	var canBeTECFMain = false;
	var canBeEscort = false;
	var canBeTECFEscort = false;

	if(
		fleetCodes["CL"] == 1 && // Exactly 1 CL
		fleetCodes["DD"] >= 2 && // Minimum 2 DD
		(fleetCodes["CA"] + fleetCodes["CAV"]) <= 2 && // Maximum 2 CA/CAV
		fleetCodes["FBB"] <= 2 &&
		fleetCodes["BB"] == 0 &&
		fleetCodes["BBV"] == 0 && // Maximum 2 BB, no slow BB
		fleetCodes["CVL"] <= 1 && // Maximum 1 CVL
		!isSlow && // No slow ships? (need to verify, seems correct though)
		currentFleet[1].selected.type != 13 &&
		currentFleet[1].selected.type != 14 /* Flagship is not SS(V) */
	) {
		canBeEscort = true;
	}

	if(
		(fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["BBV"]) <= 2 && // Maximum 2 BB/BBV
		(fleetCodes["CV"] + fleetCodes["CVB"] + fleetCodes["CVL"]) >= 2 && // Minimum 2 CV(L/B)
		(fleetCodes["CV"] + fleetCodes["CVB"] + fleetCodes["CVL"]) <= 4 && // Maximum 4 CV(L/B)
		currentFleet[1].selected.type != 13 &&
		currentFleet[1].selected.type != 14 /* Flagship is not SS(V) */
	) {
		canBeCTFMain = true;
	}

	if(
		(fleetCodes["CL"] + fleetCodes["CA"] + fleetCodes["CAV"] + fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["BBV"]) >= 2 && // Minimum 2 CL/CA/CAV/BB/BBV
		(fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["BBV"]) <= 4 && // Maximum 4 BB/BBV
		(fleetCodes["CA"] + fleetCodes["CAV"]) <= 4 && // Maximum 4 CA/CAV
		(
			((fleetCodes["CV"] + fleetCodes["CVB"]) == 1 && fleetCodes["CVL"] == 0) ||
			((fleetCodes["CV"] + fleetCodes["CVB"]) == 0 && fleetCodes["CVL"] <= 2)
		) && // Either maximum 1 CV or maximum 2 CVL
		currentFleet[1].selected.type != 13 &&
		currentFleet[1].selected.type != 14 /* Flagship is not SS(V) */
	) {
		canBeSTFMain = true;
	}

	if(
		fleetCodes["DD"] >= 4 &&
		(fleetCodes["BBV"] + fleetCodes["CAV"] + fleetCodes["LHA"] +
		 fleetCodes["AS"] + fleetCodes["AO"] + fleetCodes["AV"] +
		 fleetCodes["CT"] + fleetCodes["CL"]) <= 2 && /* Maximum 2 BBV/CAV/LHA/AS/AO/AV/CT/CL */
		(fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["AR"] +
		 fleetCodes["SS"] + fleetCodes["SSV"] + fleetCodes["CA"] +
	 	 fleetCodes["CLT"] + fleetCodes["CV"] + fleetCodes["CVL"] +
	 	 fleetCodes["CVB"]) == 0 /* BB/FBB/AR/SS(V)/CA/CLT/CV(B)/CVL not allowed */
	) {
		canBeTECFMain = true;
	}

	if(
		(currentFleet[1].selected.type == 21 ||
		 currentFleet[1].selected.type == 22 ||
		 currentFleet[1].selected.type == 28) && /* Flagship must be CL/CT */
		(fleetCodes["CL"] + fleetCodes["CT"]) <= 2 && /* Maximum 2 CL/CT */
		fleetCodes["DD"] >= 3 && /* Minimum 3 DD */
		(fleetCodes["CA"] + fleetCodes["CAV"]) <= 2 && /* Maximum 2 CA/CAV */
		(fleetCodes["CL"] + fleetCodes["CT"] + fleetCodes["DD"] +
		 fleetCodes["CA"] + fleetCodes["CAV"]) == getNShipsInFleet() /* No other ships besides DD/CL/CT/CA/CAV allowed */
	) {
		canBETECFEscort = true;
	}

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

var tabs = ["fleetStats", "fleetInfo"];

function showTab(tab) {
	for (var i = 0; i < tabs.length; i++) {
		document.getElementById(tabs[i]+"Tab").className = "secTab";
		document.getElementById(tabs[i]+"Section").style.display = "none";
	}

	document.getElementById(tab+"Tab").className = "selectedSecTab";
	document.getElementById(tab+"Section").style.display = "block";
}

window.onload = function() {
	populateFleetSelector();

	for (var i = 1; i <= 6; i++) {
		(function(n) {
			var sel = document.getElementById("flt-sel-"+n);
			var mdl = document.getElementById("flt-model-"+n);
			var lvl = document.getElementById("flt-lvl-"+n);

			sel.onchange = function() { newBaseShipSelected(n); updateFleetInfoTab(); };
			mdl.onchange = function() { updateShipModel(n); updateFleetInfoTab(); };
			lvl.onchange = function() { updateStatsForShip(n); updateFleetInfoTab(); };

			document.getElementById("flt-itm-"+n+"-1").onchange = function() { updateShipItem(n, 1); updateFleetInfoTab(); };
			document.getElementById("flt-itm-"+n+"-2").onchange = function() { updateShipItem(n, 2); updateFleetInfoTab(); };
			document.getElementById("flt-itm-"+n+"-3").onchange = function() { updateShipItem(n, 3); updateFleetInfoTab(); };
			document.getElementById("flt-itm-"+n+"-4").onchange = function() { updateShipItem(n, 4); updateFleetInfoTab(); };
		})(i);

		newBaseShipSelected(i);
	}

	updateFleetInfoTab();

	for (var i = 0; i < tabs.length; i++) {
		(function(t) {
			var tab = document.getElementById(t+"Tab");
			tab.onclick = function() { showTab(t); };
		})(tabs[i]);
	}
}
