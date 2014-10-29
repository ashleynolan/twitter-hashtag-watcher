

var http = require('http'),		//http - give me server
	fs = require('fs'),			//fs - filesystem libraru
	path = require('path');		//http://nodejs.org/docs/v0.4.9/api/path.html



function init (app, config) {

	require('./server')(app, config);

	 // ====================
	 // === MODELS SETUP ===
	 // ====================
	var models_path = __dirname + '/db/models'
	fs.readdirSync(models_path).forEach(function (file) {
	  if (~file.indexOf('.js')) require(models_path + '/' + file)
	})


	//Create the HTTP server with the express app as an argument
	var server = http.createServer(app);

	//Create the server
	server.listen(app.get('port'), function(){
		console.log('app.js: Express server listening on port ' + app.get('port'));
	});
	server.on('close', function(socket) {
		console.log('app.js: Server has closed');
	});


	//  ===============================
	//  === SOCKET CONNECTION SETUP ===
	//  ===============================
	var socketServer = require('./server/socketServer')(app, server);


	//  ================================
	//  === TWITTER CONTROLLER SETUP ===
	//  ================================
	var twitterController = require('./server/controllers/twitterApiLinkController');
	twitterController.init(socketServer, config);


	//  ===================
	//  === INIT THE DB ===
	//  ===================
	var db = require('./db')(twitterController, config);


	//  ================================
	//  === APPLICATION ROUTES SETUP ===
	//  ================================
	require('core/server/routes')(app);

}


module.exports = init;
