var fs = require("fs");
var path = require("path");

var ships = {};
var shipSeries = {};
var shipSuffixes = {};
var items = {};
var shipTypes = {};
var typeCollections = {};

function readInJSONList(filename) {
	var db = fs.readFileSync(path.join(__dirname, "../KanColle-JSON-Database/db/") + filename, 'utf8');
	var JSONLines = db.split('\n');

	var ret = {};

	for(var i=0;i<JSONLines.length;i++) {
		if(JSONLines[i] == '') {
			continue;
		}

		var obj = JSON.parse(JSONLines[i]);

		ret[obj.id] = obj;
	}

	return ret;
}

var shipsDB = function() {
	this.ships = readInJSONList('ships.json');
	this.shipSeries = readInJSONList('ship_series.json');
	this.shipSuffixes = readInJSONList('ship_namesuffix.json');
	this.shipTypes = readInJSONList('ship_types.json');
	this.typeCollections = readInJSONList('ship_type_collections.json');
};

var itemsDB = function() {
	this.items = readInJSONList('items.json');
	this.itemTypes = readInJSONList('item_types.json');
	this.typeCollections = readInJSONList('item_type_collections.json');

	for (var id in this.items) {
		if (this.items.hasOwnProperty(id)) {
			var item = this.items[id];
			if(!this.itemTypes[item.type].hasOwnProperty("items"))
				this.itemTypes[item.type].items = [];
			this.itemTypes[item.type].items.push(item);
		}
	}
};

shipsDB.prototype.getShipDataByID = function (id) {
	if(this.ships.hasOwnProperty(id)) {
		return this.ships[id];
	}
};

shipsDB.prototype.getBaseShips = function () {
	var ret = [];

	for (var id in this.shipSeries) {
		if (this.shipSeries.hasOwnProperty(id)) {
			ret.push(this.ships[this.shipSeries[id].ships[0].id]);
		}
	}

	return ret;
};

shipsDB.prototype.getShipEnglishName = function (id) {
	if(this.ships.hasOwnProperty(id)) {
		return this.ships[id].name.english;
	}
	return "";
};

shipsDB.prototype.getTypeDataByID = function (id) {
	if(this.shipTypes.hasOwnProperty(id)) {
		return this.shipTypes[id];
	}
};

shipsDB.prototype.getShipCollections = function (){
	var ret = [];

	for (var id in this.typeCollections) {
		if (this.typeCollections.hasOwnProperty(id)) {
			ret.push(this.typeCollections[id]);
		}
	}

	return ret;
};

shipsDB.prototype.getSuffixText = function (suffixID) {
	if(suffixID === null) {
		return ""; // ship.name.suffix will be set to null for base (unremodelled) ships
	} else if(this.shipSuffixes.hasOwnProperty(suffixID)) {
		return this.shipSuffixes[suffixID].ja_romaji;
	}
};

itemsDB.prototype.getItemByID = function (id) {
	if(this.items.hasOwnProperty(id)) {
		return this.items[id];
	}
};

itemsDB.prototype.getTypeDataByID = function (id) {
	if(this.itemTypes.hasOwnProperty(id))
		return this.itemTypes[id];
};

itemsDB.prototype.getTypeCollectionByID = function (id) {
	if(this.typeCollections.hasOwnProperty(id))
		return this.typeCollections[id];
};

itemsDB.prototype.getAllItemsOfType = function (type) {
	if(typeof type === "number") {
		return this.itemTypes[type].items;
	} else if(type.constructor === Array) {
		var ret = [];

		for (var i = 0; i < type.length; i++) {
			ret = ret.concat(this.itemTypes[type[i]].items);
		}
		
		return ret;
	}
};

function KanColle_JSON_DB() {
	this.ships = new shipsDB();
	this.items = new itemsDB();
};



module.exports = new KanColle_JSON_DB();
