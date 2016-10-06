var app = require('electron').remote.app;
var path = require('path');
var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));

var Expedition = function(id) {
	var data = kcJSON.expeds.getExpeditionByID(id);

	for(var prop in data) {
		if(data.hasOwnProperty(prop)) {
			this[prop] = data[prop];
		}
	}
}

module.exports = Expedition;

/* For the usual expeditions. */
function expedCompSubst(type) {
	switch(kcJSON.ships.shipTypes[type].code) {
		case 'CVL':
		case 'CVB': // not sure why you'd send a CVB on expedition but okay...
		case 'AV':
			return 'CV';
		case 'SSV':
			return 'SS';
		case 'CT':
			return 'CL';
		default:
			return false;
			// default is kcJSON.ships.shipTypes[type].code actually but fleet.checkComposition does that for us
	}
}

Expedition.prototype.fleetFitsComp = function (fleet) {
	if(this.id === 32) {
		// Requires CT flagship, NOT CL.
		return fleet.checkComposition(this.composition, undefined, "CT");
	} else if(this.id == 36) {
		// don't do the usual substitutions for AV.
		return fleet.checkComposition(this.composition);
	} else if(this.id == 24 || this.id === 40) {
		// flagship must be CL (also don't do the usual substitutions for AV)
		return fleet.checkComposition(this.composition, undefined, "CL");
	} else {
		return fleet.checkComposition(this.composition, expedCompSubst);
	}
};

Expedition.prototype.testFleetFitsComp = function (fleet) {
	if(this.id === 32) {
		// Requires CT flagship, NOT CL.
		return fleet.testComposition(this.composition, undefined, "CT");
	} else if(this.id == 36) {
		// don't do the usual substitutions for AV.
		return fleet.testComposition(this.composition);
	} else if(this.id == 24 || this.id === 40) {
		// flagship must be CL (also don't do the usual substitutions for AV)
		return fleet.testComposition(this.composition, undefined, "CL");
	} else {
		return fleet.testComposition(this.composition, expedCompSubst);
	}
};

Expedition.prototype.testFleetDrums = function (fleet) {
	/* Iterate through all ships and items: */
	var fleetDrumItems = 0;
	var fleetDrumCarriers = 0;
	for (var i = 0; i < fleet.ships.length; i++) {
		var ship = fleet.ships[i];
		var nDrums = 0;

		for(var i2=0;i2<ship.currentEquipment.length;i2++) {
			if(ship.currentEquipment[i2] != null) {
				if(ship.currentEquipment[i2].type == 41) {
					nDrums += 1;
				}
			}
		}

		if(nDrums > 0) {
			fleetDrumCarriers += 1;
			fleetDrumItems += nDrums;
		}
	}

	return {
		"items": (fleetDrumItems >= this.drum.items),
		"carriers": (fleetDrumCarriers >= this.drum.carriers)
	};
};

Expedition.prototype.getProperItemName = function (type) {
	switch(type) {
		case 'bucket': return "Repair Bucket";
		case 'devmat': return "Development Material";
		case 'torch': return "Construction Torch";
		case 'smallBox': return "Small Coin Box";
		case 'medBox': return "Medium Coin Box";
		case 'largeBox': return "Large Coin Box";
		default: return "None";
	}
};

Expedition.prototype.fleetHasDrums = function (fleet) {
	var test = this.testFleetDrums(fleet);
	return (test.items && test.carriers);
}

Expedition.prototype.getFleetConsumption = function (fleet) {
	var fltConsum = fleet.getConsumption();

	fltConsum.ammo = Math.round(fltConsum.ammo*this.consum.ammo);
	fltConsum.fuel = Math.round(fltConsum.fuel*this.consum.fuel);

	return fltConsum;
};

Expedition.prototype.getHourlyConsumption = function(fleet) {
	var hourlyMultiplier = (60 / this.time);
	var fltConsum = this.getFleetConsumption(fleet);

	fltConsum.ammo = Math.round(fltConsum.ammo * hourlyMultiplier);
	fltConsum.fuel = Math.round(fltConsum.fuel * hourlyMultiplier);

	return fltConsum;
}

Expedition.prototype.getFleetIncome = function(fleet, gs) {
	// item ID 68: Daihatsu
	// ID 166: Daihatsu w/ Type 89
	// ID 167: Special Type 2 Amphibious Landing Craft

	var nCrafts = 0;
	var nStars = 0;
	var bonusSubsum = 0;

	/* Iterate through every piece of equipment in the fleet looking for landing crafts: */
	for (var i = 0; i < fleet.ships.length; i++) {
		var ship = fleet.ships[i];
		for(var i2=0;i2<ship.currentEquipment.length;i2++) {
			if(ship.currentEquipment[i2] != null) {
				if(ship.currentEquipment[i2].type == 68 ||
					ship.currentEquipment[i2].type == 166 ||
					ship.currentEquipment[i2].type == 167) {

					nCrafts += 1;
					if(ship.currentEquipment[i2].improv) {
						nStars += ship.currentEquipment[i2].improv;
					}

					switch(ship.currentEquipment[i2].type) {
						case 68: bonusSubsum += 0.05; break;
						case 166: bonusSubsum += 0.02; break;
						case 167: bonusSubsum += 0.01; break;
						default: break;
					}
				}
			}
		}
	}

	var bonusMultiplier = 1;

	if(nCrafts > 0) {
		bonusMultiplier += Math.min(0.2, bonusSubsum);
		bonusMultiplier += (0.01 * nStars * Math.min(0.2, bonusSubsum) / nCrafts);
	}

	bonusMultiplier *= (gs ? 1.5 : 1.0);

	var ret = $.extend({}, this.resource);

	ret.fuel = Math.floor(ret.fuel * bonusMultiplier);
	ret.ammo = Math.floor(ret.ammo * bonusMultiplier);
	ret.steel = Math.floor(ret.steel * bonusMultiplier);
	ret.bauxite = Math.floor(ret.bauxite * bonusMultiplier);

	ret.normal_item = $.extend({}, this.normal_item);
	ret.normal_item.count *= 0.5;

	ret.gs_item = $.extend({}, this.gs_item);

	return ret;
}

Expedition.prototype.getHourlyIncome = function (fleet, gs) {
	var hourlyMultiplier = (60 / this.time);

	var ret = $.extend({}, this.resource);
	if(fleet) {
		ret = this.getFleetIncome(fleet, gs);
	} else {
		ret.fuel *= (gs ? 1.5 : 1.0);
		ret.ammo *= (gs ? 1.5 : 1.0);
		ret.steel *= (gs ? 1.5 : 1.0);
		ret.bauxite *= (gs ? 1.5 : 1.0);
	}

	ret.fuel = Math.round(ret.fuel, hourlyMultiplier);
	ret.ammo = Math.round(ret.ammo, hourlyMultiplier);
	ret.steel = Math.round(ret.steel, hourlyMultiplier);
	ret.bauxite = Math.round(ret.bauxite, hourlyMultiplier);

	ret.normal_item = $.extend({}, this.normal_item);
	ret.normal_item.count *= hourlyMultiplier * 0.5; // avg. chance is 50% for items.

	ret.gs_item = $.extend({}, this.gs_item);
	ret.gs_item.count *= hourlyMultiplier; // GS item chance is 100% however.

	return ret;
};

Expedition.prototype.getFleetResources = function (fleet, gs) {
	var income = this.getFleetIncome(fleet, gs);
	var consum = this.getFleetConsumption(fleet);

	income.fuel -= consum.fuel;
	income.ammo -= consum.ammo;

	return income;
};

Expedition.prototype.getHourlyResources = function (fleet, gs) {
	var income = this.getHourlyIncome(fleet, gs);
	var consum = this.getHourlyConsumption(fleet);

	income.fuel -= consum.fuel;
	income.ammo -= consum.ammo;

	return income;
};


Expedition.prototype.isSupportExpedition = function () {
	if(this.id == 33 || this.id == 34 || this.id > 100) {
		 // Expeditions > 100 are usually event-specific, and are usually the support expeditions for that event.
		 // Exceptions exist (that one expedition for Winter 2016(?) comes to mind)
		return true;
	}
	return false;
};
