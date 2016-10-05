var app = require('electron').remote.app;
var path = require('path');
var $ = require('jquery');

var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Ship = require(path.join(app.getAppPath(), 'js/ship.js'));

/* Handles the fleet and equipment selectors.
 * Should only be used in index.html!
 */

var emptySlotLabel = "<Empty Slot>";

/*
 * Fleet and Item Selectors:
 */

function disableItemSlot(slotNum, itemSlot) {
	// clear and disable the item selector:
	$("#flt-itm-"+slotNum+"-"+itemSlot).empty().prop("disabled", true);

	// clear the hangar slot display:
	$("#flt-hangar-"+slotNum+"-"+itemSlot).text("");
}

function disableSelectorSlot(slotNum) {
	// clear and disable model and level selectors:
	$("#flt-model-"+slotNum).empty().prop("disabled", true)
	$("#flt-lvl-"+slotNum).val(1).prop("disabled", true);

	// disable all item slots:
	for(var i=1;i<=4;i++) {
		disableItemSlot(slotNum, i);
	}

	// clear ship type display
	$("#flt-type-"+slotNum).text("");

	/* Set selected ship series to <Empty Slot> */
	$("#flt-sel-"+slotNum).val("");
}

function refreshSlot(fleet, slotNum) {
	if(fleet.ships.length < (slotNum-1) || fleet.ships[slotNum-1] == null) {
		return disableSelectorSlot(slotNum);
	}

	var series = kcJSON.ships.shipSeries[fleet.ships[slotNum-1].series];
	var seriesIdx = 0;

	/* Set series selector: */
	$("#flt-sel-"+slotNum).val(fleet.ships[slotNum-1].getBaseShipID());

	/* Populate remodel selector: */
	$("#flt-model-"+slotNum).empty();
	for (var i = 0; i < series.ships.length; i++) {
		if(series.ships[i].id == fleet.ships[slotNum-1].id) {
			seriesIdx = i;
		}

		var opt = document.createElement('option');
		var data = kcJSON.ships.getShipDataByID(series.ships[i].id);

		opt.value = data.id;
		opt.text = kcJSON.ships.getSuffixText(data.name.suffix);

		$("#flt-model-"+slotNum).append(opt);
	}

	/* Set level, remodel, and ship type: */
	$("#flt-lvl-"+slotNum).val(fleet.ships[slotNum-1].level);
	$("#flt-model-"+slotNum).val(fleet.ships[slotNum-1].id);
	$("#flt-type-"+slotNum).text(fleet.ships[slotNum-1].getTypeInfo().code);

	/* Adjust item selectors: */
	updateItemSelectors(fleet.ships[slotNum-1], slotNum);

	for(var i2=0;i2<fleet.ships[slotNum-1].getMaxEquipSlot();i2++) {
		$("#flt-itm-"+slotNum+"-"+(i2+1)).val(
			(fleet.ships[slotNum-1].currentEquipment[i2] != null) ?
			fleet.ships[slotNum-1].currentEquipment[i2].id : ""
		);
	}
}

function removeShipFromFleet(fleet, slotNum) {
	fleet.removeShip(slotNum-1);

	/* Refresh all ships: */
	for(var i=slotNum;i<=6;i++) {
		refreshSlot(fleet, i);
	}
}

function addShipToFleet(fleet, ship) {
	fleet.addShip(ship);

	/* Refresh all ships: */
	for(var i=1;i<=6;i++) {
		refreshSlot(fleet, i);
	}
}

function setShipInFleet(fleet, ship, slotNum) {
	fleet.ships[slotNum-1] = ship;
	refreshSlot(fleet, slotNum);

	fleet.onUpdate.fire(slotNum-1);
}

function newBaseShipSelected(fleet, slotNum) {
	if($("#flt-sel-"+slotNum).val() === "") {
		return removeShipFromFleet(fleet, slotNum);
	} else if(fleet.ships[slotNum-1] == null) {
		// adding new ship to fleet:
		return addShipToFleet(fleet, new Ship($("#flt-sel-"+slotNum).val()));
	} else {
		return setShipInFleet(fleet,
								new Ship($("#flt-sel-"+slotNum).val()),
								slotNum);
	}
}

function updateShipModel(fleet, slotNum) {
	return setShipInFleet(fleet, new Ship($("#flt-model-"+slotNum).val()), slotNum);
}

function updateShipLevel(fleet, slotNum) {
	fleet.ships[slotNum-1].level = $("#flt-lvl-"+slotNum).val();
	fleet.onUpdate.fire(slotNum-1);
}

function updateShipItem(fleet, slotNum, itemNum) {
	if($("flt-itm-"+slotNum+"-"+itemNum).val() === "") {
		fleet.ships[slotNum-1].unequipItem(itemNum-1);
	} else {
		fleet.ships[slotNum-1].equipItem(
			itemNum-1,
			kcJSON.items.getItemByID($("#flt-itm-"+slotNum+"-"+itemNum).val())
		);
	}

	fleet.onUpdate.fire(slotNum-1);
}

function updateItemSelectors(ship, slotNum) {
	var equipTypes = ship.getEquippableItemTypes();

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

	/* Prepare elements for usable slots: */
	for (var i = 1; i <= ship.getMaxEquipSlot(); i++) {
		$("#flt-itm-"+slotNum+"-"+i).empty();

		for (var i2 = 0; i2 < optGroups.length; i2++) {
			$("#flt-itm-"+slotNum+"-"+i).append(optGroups[i2].cloneNode(true));
		}

		var deSel= document.createElement("option");
		deSel.value = "";
		deSel.label = emptySlotLabel;

		$("#flt-itm-"+slotNum+"-"+i).append(deSel).prop("disabled", false);
	}

	/* Clear disabled item slots: */
	for(var i=ship.getMaxEquipSlot()+1; i<=4; i++) {
		disableItemSlot(slotNum, i);
	}
}

function setDefaultSelectedItems(ship, slotNum) {
	for(var i=1; i<=ship.getMaxEquipSlot(); i++) {
		$("#flt-itm-"+slotNum+"-"+i).val(
			(ship.currentEquipment[i-1] != null) ?
			ship.currentEquipment[i-1].id : "" );
	}
}

function initFleetSelector() {
	var typeCollections = kcJSON.ships.getShipCollections();
	var baseShips = kcJSON.ships.getBaseShips();

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

		$(".flt-sel").append(optGroup);
	}

	var deSel= document.createElement("option");
	deSel.value = "";
	deSel.label = emptySlotLabel;
	$(".flt-sel").append(deSel);
}

$( initFleetSelector );

$(function() {
	for (var i = 1; i <= 6; i++) {
		(function(n) {
			$("#flt-sel-"+n).change(function() { newBaseShipSelected(currentFleet, n); });
			$("#flt-model-"+n).change(function() { updateShipModel(currentFleet, n); });
			$("#flt-lvl-"+n).change(function() { updateShipLevel(currentFleet, n); });

			$("#flt-itm-"+n+"-1").change(function() { updateShipItem(currentFleet, n, 1); });
			$("#flt-itm-"+n+"-2").change(function() { updateShipItem(currentFleet, n, 2); });
			$("#flt-itm-"+n+"-3").change(function() { updateShipItem(currentFleet, n, 3); });
			$("#flt-itm-"+n+"-4").change(function() { updateShipItem(currentFleet, n, 4); });
		})(i);

		refreshSlot(currentFleet, i);
	}
});
