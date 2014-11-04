/*	Author:
		TMW - (Author Name Here)
*/

// --------------------------------------------- //
// DEFINE GLOBAL LIBS                            //
// --------------------------------------------- //
// Uncomment the line below to expose jQuery as a global object to the usual places
// window.jQuery = window.$ = require('./libs/jquery/jquery-1.10.2.js');

// force compilation of global libs that don't return a value.
require("./helpers/log");
require("./helpers/shims");

var Sockets = require('./modules/sockets');


//initialise KO object
var KO = {};

KO.Config = {

	init : function () {

		log('running');
		Sockets.init();
	}
};


KO.Config.init();