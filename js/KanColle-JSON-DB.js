var fs = require("fs");
var path = require("path");

var ships = {};
var items = {};

function loadShipDB() {
	var fltDB = fs.readFileSync(path.join(__dirname, "../KanColle-JSON-Database/db/") + "ships.json", 'utf8');
	var JSONLines = fltDB.split('\n');

	for(var i=0;i<JSONLines.length;i++) {
		if(JSONLines[i] == '') {
			continue;
		}

		var shipObj = JSON.parse(JSONLines[i]);
		ships[shipObj.id] = shipObj;
	}
}

function loadItemDB() {
	var itemDB = fs.readFileSync(path.join(__dirname, "../KanColle-JSON-Database/db/") + "items.json", 'utf8');
	var JSONLines = itemDB.split('\n');

	for(var i=0;i<JSONLines.length;i++) {
		if(JSONLines[i] == '') {
			continue;
		}

		var itemObj = JSON.parse(JSONLines[i]);
		items[itemObj.id] = itemObj;
	}
}

var shipsDB = function () {};
var itemsDB = function () {};

shipsDB.prototype.getEnglishNames = function () {
	var l = [];
	for(var id in ships) {
		if(ships.hasOwnProperty(id)) {
			var ship = ships[id];
			l.push(ship.name.english);
		}
	}

	return l;
};

shipsDB.prototype.getShipByEnglish = function (name) {
	for(var id in ships) {
		if(ships.hasOwnProperty(id)) {
			var ship = ships[id];
			if(ship.name.english === name) {
				return ship;
			}
		}
	}
};

loadShipDB();
loadItemDB();

exports.ships = new shipsDB();
exports.items = new itemsDB();
