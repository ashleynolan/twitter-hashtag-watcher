

var mongoose = require('mongoose'),
	Promise = require('es6-promise').Promise,

	symbol = require('core/server/controllers/symbolController'),
	state = require('core/server/controllers/stateController'),

	Symbol = mongoose.model('Symbol'),
	State = mongoose.model('State'),
	utils = require('lib/utils'),
	_ = require('underscore'),

	_this = this;



//returns a promise which resolves when the JSON is recieved by the function
exports.getJSON = function (url) {
	return new Promise(function (resolve, reject) {
		var tempJSON = require(url);
		resolve(tempJSON);
	});
};

exports.createSymbols = function(twitter) {

	return new Promise(function (resolve, reject) {

		console.log('db/api :: createSymbols');

		_this.getJSON('core/tagDefinition').then(function (tagObj) {

			//create an array of promises for our symbols
			var symbolPromises = [];

			//loop through the JSON array and create each symbol
			_.each(tagObj, function (symbolJSON, i) {
				symbolPromises.push(symbol.create(i, symbolJSON));
			});

			return Promise.all(
				symbolPromises
			);
		})
		.catch(function(err) {
			reject(err);
		})
		.then(function () {
			resolve();
		});

	});

};


exports.createStates = function () {

	return new Promise(function (resolve, reject) {

		console.log('\ndb/api :: createStates');

		//first get all the questions
		Symbol.loadAll(function (err, symbols) {

			var symbolsToCheck = [];

			symbols.forEach(function (symbol) {
				symbolsToCheck.push(_this.checkState(symbol));
			});

			return Promise.all(
				symbolsToCheck
			).then(function () {
				resolve();
			});
		});

	});
};

exports.checkState = function (symbol) {

	return new Promise(function (resolve, reject) {

		var tagsToCheck = [];

		_.each(symbol.tags, function (value, key) {
			tagsToCheck.push(_this.checkTagState(value));
		});

		return Promise.all(
			tagsToCheck
		)
		.then(function () {
			resolve();
		});
	});


};

exports.checkTagState = function (tag) {

	return new Promise(function (resolve, reject) {

		console.log('setupController: checkState: Checking state for ' + tag.tagname + ' – ' + tag._id);

		State.load(tag._id, 'today', function (err, currentState) {

			//if we can find state, great
			if (currentState) {
				console.log('setupController: checkState: State found for ' +  tag.tagname);
				resolve();

			//else create a state in the DB and set to zero
			} else {
				console.log('setupController: checkState: State not found, so creating state myself', tag.tagname);

				state.create(tag, function (err) {

					if (err) {
						console.log('setupController: checkState: ' + err + ': state not saved');
					} else {
						console.log('setupController: checkState: State saved to collection');
					}
					resolve();
				});
			}
		});

	});

};

