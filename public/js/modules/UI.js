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

		// log(name, data);
		var symbolTotal = $('.symbol--' + name + ' .symbol-total');

		if (symbolTotal.length > 0) {
			var index = 0,
				symLength = symbolTotal.length;

			for (index; index < symLength; index++) {
				symbolTotal[index].innerHTML = this.numberWithCommas(data.total);
			}
		}
	},

	numberWithCommas : function(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	},
};

module.exports = UI;