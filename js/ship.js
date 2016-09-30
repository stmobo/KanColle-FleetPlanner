var db = require('../js/KanColle-JSON-DB.js');

/*
 * Example ship object data:
 {
 	"id": 131,
	(Internal ID. Use in e.g. shipsDB.getShipDataByID)

	"no": 131,
	(In-game library ID.)

 	"class": 83,
	"class_no": 1,
	(Class ID and number; see ship_classes.json)

	"rare": 8,
	(Rarity. Ranges from 1 to 8 inclusive, where 1 = least rare and 8 = most rare.)

	"type": 6,
	(Ship type ID, see ship_types.json. Type 6 == standard BB)

	"series": 150,	(Ship remodel "series", see ship_series.json)
	"base_lvl": 1,
	"remodel": {
		"next": 136,	(Ship ID.)
		"next_lvl": 60	(Remodel level.)
	},
	(Ship remodel series and remodel data.)

	"name": {
		"suffix": null,				(Suffix code. See ship_namesuffix.json)
		"zh_cn": "大和",			  (Name in Chinese.)
		"english": "Yamato",		(Name in English.)
		"ja_romaji": "yamato",		(Name in romaji. Will be "" for foreign ships.)
		"ja_jp": "大和",			  (Name in kanji. Will be the actual ship name (in originating language) for foreign ships.)
		"ja_kana": "やまと"		  (Name in katakana(?).)
	},

	"consum": {"fuel": 250, "ammo": 300},
	"remodel_cost": {"steel": 3000, "ammo": 2500},
	"buildtime": 480,	(in minutes)

	"equip": [9, 12, 59, ""],
	(Default equipment loadouts. Also encodes number of item slots.
	Slots that start empty are "", so ship.equip.length == number of item slots available)

	"slot": [7, 7, 7, 7],
	(Plane counts per slot.)

	"additional_item_types": [6],

	"scrap": [35, 50, 100, 10],
	(Fuel / Ammo / Steel / Bauxite)
	"modernization": [7, 0, 2, 5],
	(Firepower / Torpedo / Anti-Air / Armor)

	"lines": {"start": "大和型戦艦、一番艦、大和。<br>推して参ります！"},

	"stat": {
		(Most of these should be self-explanatory.)
		"hp": 93,
		"hp_max": 98,

		"fire": 96,
		"fire_max": 129,

		"torpedo": 0,
		"torpedo_max": 0,

		"aa": 50,
		"aa_max": 94,

		"armor": 88,
		"armor_max": 108,

		"los": 15,
		"los_max": 39,

		"luck": 12,
		"luck_max": 79,

		"evasion": 27,
		"evasion_max": 59,

		"asw": 0,
		"asw_max": 0,

		"speed": 5,
		(5 = Slow, 10 = Fast)

		"range": 4,
		(Ranges from 0 <-> 4, where 0 = Short Range, e.g. DDs, and 4 = Very Long Range, e.g. Yamato)

		"carry": 28, (???)
	},

	"links": [
		{"name": "日文WIKI", "url": "http://wikiwiki.jp/kancolle/?%C2%E7%CF%C2"},
		{"name": "英文WIKI", "url": "http://kancolle.wikia.com/wiki/Yamato"}],

	"rels": {"cv": 14, "illustrator": 37},
	(See entities.json.)

	"time_modified": 1471017276800,
	"time_created": 1426087385106,
	"_id": "Vl7CTfA5VmzWbz7k",
	(Dunno what these 3 values are for. The first two might be UNIX timestamps, maybe?)
}

 */

/* Object definition for ships. */
var Ship = function(id) {
	console.log("New ship object: ID " + id)

	var data = db.ships.getShipDataByID(id);

	for(var prop in data) {
		if(data.hasOwnProperty(prop)) {
			this[prop] = data[prop];
		}
	}

	/* Set up current equipment: */
	this.currentEquipment = [];

	for (var i = 0; i < this.equip.length; i++) {
		if(this.equip[i] !== "") {
			this.currentEquipment[i] = db.items.getItemByID(this.equip[i]);
		} else {
			this.currentEquipment[i] = null;
		}
	}
};

Ship.prototype.getRemodels = function () {
	var cur = this;
	var ret = [this];
	while(cur.remodel.hasOwnProperty("next")) {
		cur = db.ships.getShipDataByID(cur.remodel.next);
		ret.push(cur);
	}

	return ret;
};

Ship.prototype.getFullName = function () {
	if(this.name.suffix == null) {
		return this.name.english;
	} else {
		return this.name.english + " " + db.ships.getSuffixText(this.name.suffix);
	}
};

Ship.prototype.getMaxEquipSlot = function() {
	return this.equip.length;
};

Ship.prototype.getRangeStat = function () {
	var range = this.stat.range;
	for (var i = 0; i < this.getMaxEquipSlot(); i++) {
		if(this.currentEquipment[i] != null) {
			if(this.currentEquipment[i].stat.hasOwnProperty("range")) {
				range += this.currentEquipment[i].stat.range;
			}
		}
	}

	return Math.min(range, 4);
};

Ship.prototype.getRangeString = function () {
	switch (this.getRangeStat()) {
		case 1:
			return "Short";
		case 2:
			return "Medium";
		case 3:
			return "Long";
		case 4:
			return "Very Long";
		default:
			return "Unknown";
	}
};

Ship.prototype.getSpeedString = function () {
	if(this.stat.speed == 5)
		return "Slow";
	return "Fast";
};

Ship.prototype.equipItem = function(slotNum, item) {
	if(slotNum >= this.getMaxEquipSlot())
		return false;

	this.currentEquipment[slotNum] = item;
	return true;
};

Ship.prototype.unequipItem = function (slotNum) {
	if(slotNum >= this.getMaxEquipSlot())
		return false;

	this.currentEquipment[slotNum] = null;
	return true;
};

Ship.prototype.getTypeInfo = function () {
	return db.ships.getTypeDataByID(this.type);
};

Ship.prototype.getEquippableItemTypes = function () {
	var classEquippable = db.ships.getTypeDataByID(this.type).equipable;

	if(this.hasOwnProperty("additional_item_types")) {
		return classEquippable.concat(this.additional_item_types);
	}

	return classEquippable;
};

/* Estimate a ship's stats at a given level.
 * [stat] can be one of:
  	* 'fire'
	* 'torpedo'
	* 'aa'
	* 'armor'
	* 'evasion'
	* 'los'
	* 'asw'
 * (Others like 'hp' and 'luck' will work but they don't increase on level up)
 */
function linEstShipStat (ship, stat, level) {
	if(ship.stat.hasOwnProperty(stat)) {
		return Math.round(ship.stat[stat] + ((ship.stat[stat + "_max"] - ship.stat[stat]) * level / 99.0));
	} else {
		return false;
	}
};

Ship.prototype.estimateStatsAtLevel = function(level) {
	return {
		"hp":	(level >= 100) ? this.stat.hp_max : this.stat.hp,
		"fire": linEstShipStat(this, "fire", level),
		"torpedo": linEstShipStat(this, "torpedo", level),
		"aa": linEstShipStat(this, "aa", level),
		"armor": linEstShipStat(this, "armor", level),
		"asw": linEstShipStat(this, "asw", level),
		"los": linEstShipStat(this, "los", level),
		"evasion": linEstShipStat(this, "evasion", level),
		"luck": this.stat.luck
	};
}

Ship.prototype.getCurrentStats = function (level) {
	var stats = this.estimateStatsAtLevel(level);

	for (var i = 0; i < this.getMaxEquipSlot(); i++) {
		if(this.currentEquipment[i] != null) {
			for (var statName in this.currentEquipment[i].stat) {
				if (this.currentEquipment[i].stat.hasOwnProperty(statName) &&
					stats.hasOwnProperty(statName)) {
					stats[statName] += this.currentEquipment[i].stat[statName];
				}
			}
		}
	}

	return stats;
}

Ship.prototype.canOASW = function (level) {
	if(this.id === 141)	// Isuzu Kai Ni
		return true;

	var stats = this.getCurrentStats(level);
	if(stats.asw >= 100) {
		for (var i = 0; i < this.getMaxEquipSlot(); i++) {
			if(this.currentEquipment[i] != null) {
				// Check if item is a sonar
				if(this.currentEquipment[i].type == 27 ||
					this.currentEquipment[i].type == 28) {
						return true;
				}
			}
		}
	}

	return false;
};

/* 0 = None
 * 1 = Double Attack Only
 * 2 = Basic Cut-In Only
 * 3 = Radar CI Only
 * 4 = AP Shell CI Only
 * 5 = Both DA + AP Shell CI
 * 6 = DA and Sec. Gun CI
 */
Ship.prototype.getArtillerySpotting = function () {
	var nMain = 0;
	var nSecondary = 0;
	var hasSeaplane = false;
	var hasRadar = false;
	var hasAPShell = false;

	for (var i = 0; i < this.getMaxEquipSlot(); i++) {
		var equip = this.currentEquipment[i];
		if(equip != null) {
			switch(equip.type) {
				case 4:
				case 5:
				case 6: // Main Guns
					nMain += 1;
					break;
				case 7: // Secondary Guns
					nSecondary += 1;
					break;
				case 11: // AP Shell
					hasAPShell = true;
					break;
				case 15: // Recon Seaplane
				case 16: // Night Recon Seaplane
				case 17: // Seaplane Bomber
					hasSeaplane = true;
					break;
				case 25: // Small Radar
				case 26: // Large Radar
				case 47: // Large Radar (II?)
					hasRadar = true;
					break;
				default: break;
			}
		}
	}

	var hasDA = false;
	var ciType = 0; // 0 = none, 1 = basic, 2 = radar, 3 = AP shell

	if(!hasSeaplane)
		return 0; // no daytime special attacks w/o a seaplane

	if(nMain >= 2)
		hasDA = true;

	if(nMain >= 1) {
		if(hasRadar) {
			ciType = 2;
		} else if(hasAPShell) {
			ciType = 3;
		} else if(nSecondary >= 1) {
			ciType = 1;
		}
	}

	if(hasDA) {
		switch(ciType) {
			case 1: return 6; // Hybrid DA + Sec.Gun CI
			case 2: return 1; // 2xMainGun + Radar + Seaplane = only a DA.
			case 3: return 5; // Hybrid DA + AP CI

			case 0:
			default:
				return 1; // only a DA
		}
	} else {
		switch(ciType) {
			case 1: return 2; // Secondary CI
			case 2: return 3; // Radar CI
			case 3: return 4; // AP Shell CI

			case 0:
			default:
				return 0; // No DA, no CI
		}
	}

	return 0; // just in case
};

Ship.prototype.getAACI = function () {
	/* Gather data on AACI prereqs */
	var nHAGuns = 0;		// High-Angle mounted gun
	var nBuiltInFDGuns = 0; // High-Angle Gun + Built-in AAFD

	var hasMainGun = false;
	var hasSanshiki = false;
	var hasAAFD = false;
	var hasRadar = false;
	var has25mmCD = false;
	var hasAASecondary = false;

	for (var i = 0; i < this.getMaxEquipSlot(); i++) {
		var equip = this.currentEquipment[i];
		if(equip != null) {
			switch(equip.type) {
				case 3: // HA + AAFD
					nBuiltInFDGuns += 1;
					hasAAFD = true;
					// fall thru
				case 2: // HA Mount
					nHAGuns += 1;
					break;
				case 5:
				case 6: // Large-Caliber Main Guns
					hasMainGun = true;
					break;
				case 9:	// AA Secondary Gun + AAFD
					hasAAFD = true;
					// fall thru
				case 8: // AA Secondary Gun
					hasAASecondary = true;
					break;
				case 10: // Anti-Aircraft Shell
					hasSanshiki = true;
					break;
				case 24:
				case 25: // Radar
					// TODO: create a new item type for Air Radars and check that instead
					if(equip.id == 27 ||
						equip.id == 30 ||
						equip.id == 32 ||
						equip.id == 89 ||
						equip.id == 106) {
						hasRadar = true;
					}
					break;
				case 30: // Concentrated Deployment AA Guns
					has25mmCD = true;
					// fall thru
				case 29: // Secondary AA Guns
					hasAASecondary = true;
					break;
				case 31: // Anti-Aircraft Fire Director
					hasAAFD = true;
					break;
				default:
					break;
			}
		}
	}

	/* Now actually resolve the AACI.
	 * For AACI resolution, we move down the list of possible AACIs from
	 * most-damaging to least, taking the first that we fulfill.*/

	/* Sorted AACI List:
	 * +8:
	 *  - Type 10: Maya K2 + HA + 25mmCD + Radar
	 * +7:
	 *  - Type 1: Akizuki-Class + 2xHA + Radar
	 * +6:
	 *  - Type 2: Akizuki-Class + HA + Radar
	 *  - Type 4: Battleship + Main Gun + Sanshiki + AAFD + Radar
	 *  - Type 11: Maya K2 + HA + 25mmCD
	 * +5:
	 *  - [none]
	 * +4:
	 *  - Type 3: Akizuki-Class + 2xHA
	 *  - Type 5: Any + 2x Built-In HA + Radar
	 *  - Type 6: Battleship + Main Gun + Sanshiki + AAFD
	 *  - Type 8: Any + Built-in HA + Radar
	 *  - Type 14: Isuzu K2 + HA + Secondary AA + Radar
	 *  - Type 16: Kasumi K2B + HA + Secondary AA + Radar
	 * +3:
	 *  - Type 7: Any + HA Mount + AAFD + Radar
	 *  - Type 12: Any + 25mmCD + Secondary AA + Radar
	 *  - Type 15: Isuzu K2 + HA + Secondary AA
	 * +2:
	 *  - Type 9: Any + HA + AAFD
	 *  - Type 17: Kasumi K2B + HA + Secondary AA
	 *  - Type 18: Satsuki K2 + 25mmCD
	 */

	/* Maya, Akizuki-class, and Battleship special AACIs all shoot down more
	*  planes than any general (any-ship) AACI, so we can just check them first. */
	if(this.id == 428) {
		// Maya K2
		if(nHAGuns >= 1 && has25mmCD && hasRadar) {
			return 10; // +8
		} else if(nHAGuns >= 1 && has25mmCD) {
			return 11; // +6
		}
	} else if(this.type == 19) {
		// Akizuki-class DD
		if(nHAGuns >= 2 && hasRadar) {
			return 1; // +7
		} else if(nHAGuns >= 1 && hasRadar) {
			return 2; // +6
		} else if(nHAGuns >= 2) {
			return 3; // +4
		}
	} else if(this.type == 6 ||
		this.type == 7 ||
		this.type == 8 ||
		this.type == 18 ||
		this.type == 20)
	{
		// Ship is a battleship
		if(hasMainGun && hasSanshiki && hasAAFD && hasRadar) {
			return 4; // +6
		} else if(hasMainGun && hasSanshiki && hasAAFD) {
			return 6; // +4
		}
	}

	if(nBuiltInFDGuns >= 2 && hasRadar) {
		return 5; // +4
	} else if(nBuiltInFDGuns >= 1 && hasRadar) {
		return 8; // +4
	} else if(this.id == 141 && nHAGuns >= 1 && hasAASecondary && hasRadar) {
		// Isuzu K2
		return 14; // +4
	} else if(this.id == 471 && nHAGuns >= 1 && hasAASecondary && hasRadar) {
		// Kasumi K2B
		return 16; // +4
	} else if(nHAGuns >= 1 && hasAAFD && hasRadar) {
		return 7; // +3
	} else if(has25mmCD && hasAASecondary && hasRadar) {
		return 12; // +3
	} else if(this.id == 141 && nHAGuns >= 1 && hasAASecondary) {
		// Isuzu K2 again
		return 15; // +3
	} else if(nHAGuns >= 1 && hasAAFD) {
		return 9; // +2
	} else if(this.id == 471 && nHAGuns >= 1 && hasAASecondary) {
		// Kasumi K2B again
		return 17; // +2
	} else if(this.id == 418 && has25mmCD) {
		// Satsuki K2
		return 18;
	}

	return 0;
};

module.exports = Ship;
