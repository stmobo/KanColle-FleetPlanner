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
		if(this.equip[i] != "")
			this.currentEquipment[i] = db.items.getItemByID(this.equip[i]);
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

Ship.prototype.getRangeString = function () {
	switch (this.stat.range) {
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

Ship.prototype.getMaxEquipSlot = function() {
	return this.equip.length;
};

Ship.prototype.equipItem = function(slotNum, item) {
	if(slotNum > this.equip.length)
		return false;

	this.currentEquipment[slotNum] = item;
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
Ship.prototype.estimateStatAtLevel = function (stat, level) {
	if(this.stat.hasOwnProperty(stat)) {
		return this.stat[stat] + ((this.stat[stat + "_max"] - this.stat[stat]) * level / 99.0);
	} else {
		return false;
	}
};

module.exports = Ship;