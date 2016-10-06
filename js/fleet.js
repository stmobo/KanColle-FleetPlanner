var app = require('electron').remote.app;
var path = require('path');
var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Ship = require(path.join(app.getAppPath(), 'js/ship.js'));
var $ = require('jquery');

function Fleet() {
	// prevent creating a completely empty fleet
	this.ships = [  new Ship(kcJSON.ships.shipSeries[1].ships[0].id) ];

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

Fleet.prototype.getShipCount = function() {
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

/*
 * Parses a comma separated list of numbers and ship type codes.
 * "XX" as a type code is interpreted to mean "anything".
 *
 * By default numbers are taken as minimums.
 * Examples:
 *  "1CL,5DD" (expedition 37 composition string) -> minimum 1 CL, 5 DD.
 *  "4XX" (expedition 2 composition string) -> minimum 4 of any ship type.
 *  "5DD,1XX" (expedition 38 composition string) -> minimum 5 DDs and one other.
 *
 * In each composition substring, the first character will be interpreted as the minimal number of ships.
 * All other characters will be interpreted as a type code.
 *
 * All tests are inclusive.
 *
 * Exclamation points ('!') can be used to test for maximum ship type counts.
 *  An exclamation point used in front of a number will be interpreted as a maximum.
 *  An exclamation point used alone will be interpreted as a maximum of 0 (i.e. only return true if no ships are of that type.)
 * Examples:
 *  "!SS": Test for no submarines.
 *  "2CV,!4CV": Test to see if the number of CVs is between 2 and 4, inclusive.
 *
 * substFunc will be called for every ship in the fleet, passing in their type IDs as the only argument.
 * If this function returns a string, then that string will be used as the type code for the corresponding ship.
 * Otherwise, the type code string will be drawn from the database.
 * This function should be used to handle substitutions.
 *
 * flagshipType, as a string, can be optionally used to additionally check the ship type of the flagship,
 * for example in the Combined Fleet composition requirements (not an SS/SSV).
 *
 * flagshipType should NOT include a number (it's assumed to be one by definition).
 * It can, however, start with a '!' (see above).
 */

function testCompSubstr(codeCounts, comp, nShips) {
	if(comp.charAt(0) === '!') {
		if(isNaN(comp.charAt(1))) {
			// check if none:
			var typeCode = comp.substring(1);

			// note: we don't check for !XX, since that's impossible for any normal (KC-allowed) fleet.

			if(codeCounts.hasOwnProperty(typeCode))
				return false;

			if(codeCounts[typeCode] > 0) {
				return false;
			}
		} else {
			// test maximum:
			var maximum = Number(comp.charAt(1));
			var typeCode = comp.substring(2);

			if(typeCode === 'XX') {
				if(nShips > maximum) {
					return false;
				}
			} else {
				if(!codeCounts.hasOwnProperty(typeCode)) {
					return true;
				}

				if(codeCounts[typeCode] > maximum) {
					return false;
				}
			}
		}
	} else if(!isNaN(comp.charAt(0))) {
		// test minimum:
		var minimum = Number(comp.charAt(0));
		var typeCode = comp.substring(1);

		if(typeCode === 'XX') {
			if(nShips < minimum) {
				return false;
			}
		} else {
			if(!codeCounts.hasOwnProperty(typeCode)) {
				return false;
			}

			if(codeCounts[typeCode] < minimum) {
				return false;
			}
		}
	} else {
		throw "Invalid composition specification: " + comp;
	}

	return true;
}

Fleet.prototype.checkComposition = function (compStr, substFunc, flagshipType) {
	var codeCounts = {};

	var flagNormalizedCode = "";

	/* Get type codes for all ships: */
	for (var i = 0; i < this.ships.length; i++) {
		let normalizedCode = kcJSON.ships.shipTypes[this.ships[i].type].code;
		if(substFunc != null) {
			let newCode = substFunc(this.ships[i].type);
			if(newCode) {
				normalizedCode = newCode;
			}
		}

		if(i == 0)
			flagNormalizedCode = normalizedCode;

		if(codeCounts.hasOwnProperty(normalizedCode)) {
			codeCounts[normalizedCode] += 1;
		} else {
			codeCounts[normalizedCode] = 1;
		}
	}

	/* Parse composition strings: */
	var comp = compStr.split(',');
	for (var i = 0; i < comp.length; i++) {
		if(!testCompSubstr(codeCounts, comp[i].trim(), this.ships.length)) {
			return false;
		}
	}

	// We check for 'XX' here because actually evaluating that would be pointless.
	// !XX works, though (i.e. it always returns false).
	if(typeof flagshipType === 'string' && flagshipType !== 'XX') {
		if(flagshipType.charAt(0) === '!') {
			// test NOT type
			var typeCode = flagshipType.substring(1);
			return (flagNormalizedCode !== typeCode);
		} else {
			return (flagNormalizedCode === flagshipType);
		}
	}

	return true;
};

/* Like above, but returns true/false for each substring in an array of tuples:
 * [ {"comp": <composition string condition>, "flagship": <true if passed as flagshipType> "value": <true/false>} ... ]
 */
Fleet.prototype.testComposition = function (compStr, substFunc, flagshipType) {
	var codeCounts = {};

	var flagNormalizedCode = "";

	var ret = [];

	/* Get type codes for all ships: */
	for (var i = 0; i < this.ships.length; i++) {
		let normalizedCode = kcJSON.ships.shipTypes[this.ships[i].type].code;
		if(substFunc != null) {
			let newCode = substFunc(this.ships[i].type);
			if(newCode) {
				normalizedCode = newCode;
			}
		}



		if(i == 0)
			flagNormalizedCode = normalizedCode;

		if(codeCounts.hasOwnProperty(normalizedCode)) {
			codeCounts[normalizedCode] += 1;
		} else {
			codeCounts[normalizedCode] = 1;
		}
	}

	/* Parse composition strings: */
	var comp = compStr.split(',');
	for (var i = 0; i < comp.length; i++) {
		compSub = comp[i].trim();
		ret.push({
			'comp': compSub,
			'flagship': false,
			'value': testCompSubstr(codeCounts, compSub, this.ships.length)
		});
	}

	// we handle this separately:
	if(typeof flagshipType === 'string' && flagshipType !== 'XX') {
		if(flagshipType.charAt(0) === '!') {
			var typeCode = flagshipType.substring(1);
			ret.push({
				'comp': typeCode,
				'flagship': true,
				'value': (flagNormalizedCode !== typeCode)
			});
		} else {
			ret.push({
				'comp': flagshipType,
				'flagship': true,
				'value': (flagNormalizedCode === flagshipType)
			});
		}
	}

	return ret;
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

   for (var i = 0; i < 6; i++) {
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
		this.ships[0].type != 13 &&
		this.ships[0].type != 14 /* Flagship is not SS(V) */
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
		this.ships[0].type != 13 &&
		this.ships[0].type != 14 /* Flagship is not SS(V) */
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
		(this.ships[0].type == 21 ||
		 this.ships[0].type == 22 ||
		 this.ships[0].type == 28) && /* Flagship must be CL/CT */
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
