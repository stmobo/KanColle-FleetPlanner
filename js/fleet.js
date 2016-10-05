var app = require('electron').remote.app;
var path = require('path');
var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Ship = require(path.join(app.getAppPath(), 'js/ship.js'));
var $ = require('jquery');

function Fleet() {
	// prevent creating a completely empty fleet
	this.ships = [  new Ship(kcJSON.ships.shipSeries[0].ships[0].id); ];

	this.onUpdate = $.Callbacks();
}

Fleet.prototype.addShip = function (ship) {
	if(this.ships.length >= 6)
		return false;

	this.ships.push(ship);
	this.onUpdate.fire();
	return true;
};

Fleet.prototype.removeShip = function (n) {
	if(this.ships.length == 0)
		return false;

	this.ships.splice(n, 1);
	this.onUpdate.fire();
	return true;
};

Fleet.prototype.swapSlots = function(i, j) {
	var t = this.ships[i];
	this.ships[i] = this.ships[j];
	this.ships[j] = t;

	this.onUpdate.fire();
}

Fleet.prototype.getShipCount() {
	return this.ships.length;
}

Fleet.prototype.getCombinedLevel = function () {
	var ret = 0;
	for(var i=0;i<this.ships.legth;i++) {
		ret += this.ships[i].level;
	}
	return ret;
};

Fleet.prototype.getFighterPower = function() {
	var fighterPower = { "min":0, "max": 0};

	for(var i=0;i<this.ships.length;i++) {
		var shipFP = this.ships[i].getFighterPower();
		fighterPower.min += shipFP.min;
		fighterPower.max += shipFP.max;
	}

	return fighterPower;
}

Fleet.prototype.isFast = function () {
	for(var i=0;i<this.ships.length;i++) {
		if(this.ships[i].stat.speed == 5)
			return false;
	}

	return true;
};

Fleet.prototype.getSimpleLOS = function () {
	var los = 0;

	for(var i=0;i<this.ships.length;i++) {
		los += this.ships[i].getCurrentStats().los;
	}

	return los;
};

Fleet.prototype.getConsumption = function () {
	var consum = {"fuel":0, "ammo":0};

	for(var i=0;i<this.ships.length;i++) {
		consum.fuel += this.ships[i].consum.fuel;
		consum.ammo += this.ships[i].consum.ammo;
	}

	return consum;
};

Fleet.prototype.getShorthand = function () {
	var codes = {};

	for(var i=0;i<this.ships.length;i++) {
		var typeInfo = this.ships[i].getTypeInfo();
		if(!codes.hasOwnProperty(typeInfo.code)) {
			codes[typeInfo.code] = 1;
		} else {
			codes[typeInfo.code] += 1;
		}
	}

	var shorthand = "";
	for (var code in codes) {
		if (codes.hasOwnProperty(code)) {
			shorthand += codes[code] + code;
		}
	}

	return shorthand;
};

Fleet.prototype.getShipTypeCodes = function () {
   var counts = {};
   for (var id in kcJSON.ships.shipTypes) {
	   if (kcJSON.ships.shipTypes.hasOwnProperty(id)) {
		   var code = kcJSON.ships.shipTypes[id].code;
		   if(!counts.hasOwnProperty(code))
			   counts[code] = 0;
	   }
   }

   for (var i = 1; i <= 6; i++) {
	   if(this.ships[i] == null)
		   continue;

	   var typeInfo = this.ships[i].getTypeInfo();
	   counts[typeInfo.code] += 1;
   }

   return counts;
}

Fleet.prototype.canBeSTFMain = function () {
	var fleetCodes = this.getShipTypeCodes();

	if((fleetCodes["CL"] + fleetCodes["CA"] + fleetCodes["CAV"] + fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["BBV"]) >= 2 && // Minimum 2 CL/CA/CAV/BB/BBV
	(fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["BBV"]) <= 4 && // Maximum 4 BB/BBV
	(fleetCodes["CA"] + fleetCodes["CAV"]) <= 4 && // Maximum 4 CA/CAV
	(
		((fleetCodes["CV"] + fleetCodes["CVB"]) == 1 && fleetCodes["CVL"] == 0) ||
		((fleetCodes["CV"] + fleetCodes["CVB"]) == 0 && fleetCodes["CVL"] <= 2)
	) && // Either maximum 1 CV or maximum 2 CVL
	this.ships[i].type != 13 &&
	this.ships[i].type != 14 /* Flagship is not SS(V) */) {
		return true;
	}

	return false;
};

Fleet.prototype.canBeNormalEscort = function () {
	var fleetCodes = this.getShipTypeCodes();

	if(fleetCodes["CL"] == 1 && // Exactly 1 CL
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
		return true;
	}

	return false;
}

Fleet.prototype.canBeCTFMain = function () {
	var fleetCodes = this.getShipTypeCodes();

	if(
		(fleetCodes["BB"] + fleetCodes["FBB"] + fleetCodes["BBV"]) <= 2 && // Maximum 2 BB/BBV
		(fleetCodes["CV"] + fleetCodes["CVB"] + fleetCodes["CVL"]) >= 2 && // Minimum 2 CV(L/B)
		(fleetCodes["CV"] + fleetCodes["CVB"] + fleetCodes["CVL"]) <= 4 && // Maximum 4 CV(L/B)
		currentFleet[1].selected.type != 13 &&
		currentFleet[1].selected.type != 14 /* Flagship is not SS(V) */
	) {
		return true;
	}

	return false;
}

Fleet.prototype.canBeTECFMain = function () {
	var fleetCodes = this.getShipTypeCodes();
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
		return true;
	}

	return false;
}

Fleet.prototype.canBeTECFEscort = function () {
	var fleetCodes = this.getShipTypeCodes();
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
		return true;
	}

	return false;
}


module.exports = Fleet;
