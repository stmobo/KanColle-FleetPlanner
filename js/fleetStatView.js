var app = require('electron').remote.app;
var path = require('path');
var $ = require('jquery');

var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Ship = require(path.join(app.getAppPath(), 'js/ship.js'));

/*
 * Stats Breakdown View:
 */
function updateSlot(ship, slotNum) {
	var statRow = document.getElementById("fleetStats").rows[slotNum*2];

	var stats = ship.getCurrentStats();
	statRow.cells[1].innerHTML = ship.getFullName();
	statRow.cells[2].innerHTML = stats.hp;

	statRow.cells[3].innerHTML = stats.fire;
	statRow.cells[4].innerHTML = stats.torpedo;
	statRow.cells[5].innerHTML = stats.aa;
	statRow.cells[6].innerHTML = stats.armor;
	statRow.cells[7].innerHTML = stats.asw;

	statRow.cells[8].innerHTML = stats.evasion;
	statRow.cells[9].innerHTML = stats.los;
	statRow.cells[10].innerHTML = stats.luck;
	statRow.cells[11].innerHTML = ship.getSpeedString();
	statRow.cells[12].innerHTML = ship.getRangeString();

	var statRow2 = document.getElementById("fleetStats").rows[(slotNum*2)+1];

	// Cell 1: Anti-Installation Attack Power
	var antiInstall = ship.getInstallationAttack();
	statRow2.cells[0].textContent = "D: " + antiInstall.day + " / N: " + antiInstall.night;

	// Cell 2: Night Attack Power
	if(ship.getNBCI()) {
		var natk = stats.fire + stats.torpedo;
		natk = Math.floor(natk * 1.5);
		if(natk > 300) {
			natk = Math.floor(300 + Math.sqrt(natk - 300));
		}
		statRow2.cells[1].textContent =
		ship.getNightAttack(level) +
		" ~ " + natk;
	} else {
		statRow2.cells[1].textContent = ship.getNightAttack();
	}


	// Cell 3: AACI
	var aaciType = ship.getAACI();
	if(aaciType > 0) {
		statRow2.cells[2].textContent = "Type " + aaciType + " (+" + kcJSON.ships.getAACIShootdown(aaciType) + ")";
		statRow2.cells[2].className = "hasValue";
	} else {
		statRow2.cells[2].textContent = "No";
		statRow2.cells[2].className = "noValue";
	}

	// Cell 4: OASW
	if(ship.canOASW()) {
		statRow2.cells[3].textContent = "Yes";
		statRow2.cells[3].className = "hasValue";
	} else {
		statRow2.cells[3].textContent = "No";
		statRow2.cells[3].className = "noValue";
	}

	// Cell 5: Opening Airstrike
	var oas = ship.getOpeningAirstrike();
	statRow2.cells[4].innerHTML = oas.min + " ~ " + oas.max;

	// Cell 6: Fighter power
	var fp = ship.getFighterPower();
	statRow2.cells[5].innerHTML = fp.min + " ~ " + fp.max;

	// Cell 7: Artillery Spotting
	var artSpotType = ship.getArtillerySpotting();
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
	} else if(ship.getNBCI()) {
		statRow2.cells[6].textContent = "Night Battle Cut-In";
		statRow2.cells[6].className = "hasValue";
	} else {
		statRow2.cells[6].textContent = "No";
		statRow2.cells[6].className = "noValue";
	}

	// Cell 8: Resource consumption
	statRow2.cells[7].innerHTML =
		"Fuel: " + ship.consum.fuel +
		" Ammo: " + ship.consum.ammo;

	for (var i = 1; i <= ship.equip.length; i++) {
		var hangarElem = document.getElementById("flt-hangar-"+(slotNum)+"-"+i);
		hangarElem.innerHTML = ship.slot[i-1];
	}

	document.getElementById("flt-type-"+slotNum).innerHTML = ship.getTypeInfo().code;
}

function clearSlot(slotNum) {
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

currentFleet.onUpdate.add(function(slotNum){
	if(typeof slotNum != 'undefined') {
		// update one slot:
		updateSlot(currentFleet.ships[slotNum], slotNum+1);
	} else {
		// update everything:
		for(var i=0;i<6;i++) {
			if(currentFleet.ships[i] != null) {
				updateSlot(currentFleet.ships[i], i+1);
			} else {
				clearSlot(i+1);
			}
		}
	}
})

$(function(){
	for(var i=0;i<6;i++) {
		if(currentFleet.ships[i] != null) {
			updateSlot(currentFleet.ships[i], i+1);
		} else {
			clearSlot(i+1);
		}
	}
})
