var app = require('electron').remote.app;
var path = require('path');
var $ = require('jquery');

var kcJSON = require(path.join(app.getAppPath(), 'js/KanColle-JSON-DB.js'));
var Expedition = require(path.join(app.getAppPath(), 'js/expedition.js'));

function initExpedSelector() {
	for (var id in kcJSON.expeds.data) {
		if (kcJSON.expeds.data.hasOwnProperty(id)) {
			var opt = document.createElement("option");
			opt.value = Number(id);
			opt.label = "Expedition " + id + ": " + kcJSON.expeds.data[id].name.english;

			$("#expedSelector").append(opt);
		}
	}

	$("#expedSelector").val(1);
}

function formatItemCell(exped, itemCount, gsCount, gs) {
	var ret = "";
	if(exped.normal_item.count > 0) {
		ret += exped.getProperItemName(exped.normal_item.type)+" x"+String(itemCount).substring(0,5);
		if(gs && exped.gs_item.count > 0) {
			ret += ", \n";
		}
	}

	if(gs && exped.gs_item.count > 0) {
		ret += exped.getProperItemName(exped.gs_item.type)+" x"+String(gsCount).substring(0,5);
	}

	return ret;
}

function updateExpedInfo() {
	var exped = new Expedition($("#expedSelector").val());

	var hours = Math.floor(exped.time / 60);
	var minutes = exped.time % 60;

	$("#expedInfo-Time").text(hours+":"+minutes)
	$("#expedInfo-ShipXP").text(exped.exp.ship);
	$("#expedInfo-HQXP").text(exped.exp.hq);
}

function updateExpedComposition(fleet) {
	$("#expedComp").empty();

	var exped = new Expedition($("#expedSelector").val());

	var fitTest = exped.testFleetFitsComp(fleet);
	var compFit = true;
	for (var i = 0; i < fitTest.length; i++) {
		var li = document.createElement("li");
		li.textContent = (fitTest[i].flagship ? "Flagship: " : '') + fitTest[i].comp;
		li.className = (fitTest[i].value ? "hasValue" : "noValue");

		compFit = compFit && fitTest[i].value;

		$("#expedComp").append(li);
	}

	if(exped.drum.items > 0) {
		var drumTest = exped.testFleetDrums(fleet);

		compFit = compFit && drumTest.items && drumTest.carriers;

		var li = document.createElement("li");
		li.textContent = exped.drum.carriers + " drum carriers";
		li.className = (drumTest.carriers ? "hasValue" : "noValue");
		$("#expedComp").append(li);

		li = document.createElement("li");
		li.textContent = exped.drum.items + " drums total";
		li.className = (drumTest.items ? "hasValue" : "noValue");
		$("#expedComp").append(li);
	}

	$("#expedComp-Header").removeClass().addClass(compFit ? "hasValue" : "noValue");
}

function updateExpedStats(fleet) {
	var statsTable = document.getElementById("expedStats");
	var incomeRow = statsTable.rows[1];
	var consumRow = statsTable.rows[2];
	var totalRow = statsTable.rows[3];
	var hourlyRow = statsTable.rows[4];

	var gs = ($("#expedCheckGS:checked").val() != null);
	var exped = new Expedition($("#expedSelector").val());

	console.log("GS: " + gs);

	var income = exped.getFleetIncome(fleet, gs);
	var consum = exped.getFleetConsumption(fleet);
	var total = exped.getFleetResources(fleet, gs);
	var hourly = exped.getHourlyResources(fleet, gs);

	incomeRow.cells[1].textContent = income.fuel;
	incomeRow.cells[2].textContent = income.ammo;
	incomeRow.cells[3].textContent = income.steel;
	incomeRow.cells[4].textContent = income.bauxite;
	incomeRow.cells[5].textContent = "";

	consumRow.cells[1].textContent = consum.fuel;
	consumRow.cells[2].textContent = consum.ammo;

	totalRow.cells[1].textContent = total.fuel;
	totalRow.cells[2].textContent = total.ammo;
	totalRow.cells[3].textContent = total.steel;
	totalRow.cells[4].textContent = total.bauxite;
	totalRow.cells[5].textContent = formatItemCell(exped, total.normal_item.count, total.gs_item.count);

	hourlyRow.cells[1].textContent = hourly.fuel;
	hourlyRow.cells[2].textContent = hourly.ammo;
	hourlyRow.cells[3].textContent = hourly.steel;
	hourlyRow.cells[4].textContent = hourly.bauxite;
	hourlyRow.cells[5].textContent = formatItemCell(exped, hourly.normal_item.count, hourly.gs_item.count);
}

$( initExpedSelector );

$(function(){
	updateExpedInfo();
	updateExpedStats(currentFleet);
	updateExpedComposition(currentFleet);

	$("#expedSelector").change(function(){
		updateExpedInfo();
		updateExpedStats(currentFleet);
		updateExpedComposition(currentFleet);
	});

	$("#expedCheckGS").change(function() {
		updateExpedStats(currentFleet);
	});

	currentFleet.onUpdate.add(function(slotNum){
		updateExpedStats(currentFleet);
		updateExpedComposition(currentFleet);
	})
});
