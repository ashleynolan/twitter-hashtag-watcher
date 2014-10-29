
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var express = require('express'),
	mongoose = require('mongoose'),
	Promise = require('es6-promise').Promise,
	dbc = require('core/db/api'),
	pkg = require('package.json'),
	db;

function init (twitter, config) {

	mongoose.connect(config.global.db.path);

	db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));

	db.once('open', function callback (db) {

		console.log('Connnected to DB\n');

		//creates our questions in the db
		dbc.createSymbols(twitter)
		//then check if a state has been initialised for each question for today
		.then(dbc.createStates)
		.catch(function (err) {
			console.log('ERR' + err);
		})
		//and then after all that we open our twitter stream
		.then(twitter.openStream);

	});

	return db;

}

module.exports = init;


