/*
	UI.js
	Example module to show how to include other JS files into you browserify build
*/

// dependencies for this module go here
var $ = require('traversty'),
	qwery = require('qwery');

//give us old IE selector support (<8)
$.setSelectorEngine(qwery);

var UI = {
	init : function () {
		console.debug('KO.UI module is being initialised');
	},


	updateSymbol : function (name, data) {

		//log(name, data)
		var symbolTotal = $('.symbol--' + name + ' .symbol-total');

		symbolTotal[0].innerHTML = data.total;

	}
};

module.exports = UI;