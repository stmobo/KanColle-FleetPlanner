var fs = require("fs");
var path = require("path");

var ships = {};
var shipSeries = {};
var shipSuffixes = {};
var items = {};

function loadShipDB() {
	/* Read in main ship list */
	var fltDB = fs.readFileSync(path.join(__dirname, "../KanColle-JSON-Database/db/") + "ships.json", 'utf8');
	var JSONLines = fltDB.split('\n');

	for(var i=0;i<JSONLines.length;i++) {
		if(JSONLines[i] == '') {
			continue;
		}

		var shipObj = JSON.parse(JSONLines[i]);
		ships[shipObj.id] = shipObj;
	}

	var seriesList = fs.readFileSync(path.join(__dirname, "../KanColle-JSON-Database/db/") + "ship_series.json", 'utf8').split('\n');

	for(var i=0;i<seriesList.length;i++) {
		if(seriesList[i] == '') {
			continue;
		}

		var seriesObj = JSON.parse(seriesList[i]);
		shipSeries[seriesObj.id] = seriesObj;
	}

	var suffixList = fs.readFileSync(path.join(__dirname, "../KanColle-JSON-Database/db/") + "ship_namesuffix.json", 'utf8').split('\n');

	for(var i=0;i<suffixList.length;i++) {
		if(suffixList[i] == '') {
			continue;
		}

		var suffixObj = JSON.parse(suffixList[i]);
		shipSuffixes[suffixObj.id] = suffixObj['ja_romaji'];
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

shipsDB.prototype.getEnglishNameList = function () {
	var l = [];

	for(var seriesID in shipSeries) {
		if(shipSeries.hasOwnProperty(seriesID)) {
			var series = shipSeries[seriesID];
			if(ships.hasOwnProperty(series.ships[0].id)) {
				l.push({
					'name'	:	ships[series.ships[0].id].name.english,
					'id'	:	series.ships[0].id
				});
			}
		}
	}

	return l;
};

shipsDB.prototype.getRemodelsForShip = function (shipID) {
	if(ships.hasOwnProperty(shipID)) {
		var series = shipSeries[ships[shipID].series];
		var ret = [];

		for (var i = 0; i < series.ships.length; i++) {
			ret.push({
				'id'		:	series.ships[i].id,
				'suffix'	:	(ships[series.ships[i].id].name.suffix === null) ? '' : shipSuffixes[ships[series.ships[i].id].name.suffix],
				'level'		:	(i == 0) ? 1 : series.ships[i-1].next_lvl,
			});
		}

		return ret;
	}
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

shipsDB.prototype.getShipByID = function (id) {
	if(ships.hasOwnProperty(id)) {
		return ships[id];
	}
};

loadShipDB();
loadItemDB();

exports.ships = new shipsDB();
exports.items = new itemsDB();
