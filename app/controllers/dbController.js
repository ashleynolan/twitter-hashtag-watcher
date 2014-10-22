

var mongoose = require('mongoose')
	, Promise = require('es6-promise').Promise

	, symbol = require('../../app/controllers/symbolController')
	, state = require('../../app/controllers/stateController')

	, Symbol = mongoose.model('Symbol')
	, State = mongoose.model('State')
	, utils = require('../../lib/utils')
	, _ = require('underscore')
	, _this = this;

//returns a promise which resolves when the JSON is recieved by the function
exports.getJSON = function (url) {
	return new Promise(function (resolve, reject) {
		var tempJSON = require(url);
		resolve(tempJSON);
	});
};

exports.createSymbols = function(twitter) {

	return new Promise(function (resolve, reject) {

		_this.getJSON('../../core/tracker').then(function (response) {

			//create an array of promises for our symbols
			var symbolPromises = [];

			//loop through the JSON array and create each symbol
			_.each(response, function (symbolJSON, i) {
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
		})

	});

};


exports.createStates = function () {

	return new Promise(function (resolve, reject) {

		console.log('setupController: createStates: Creating States');

		//first get all the questions
		Symbol.loadAll(function (err, symbols) {

			var symbolsToCheck = [];

			symbols.forEach(function (s) {
				symbolsToCheck.push(_this.checkState(s));
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

		var hashtagsToCheck = [];

		_.each(symbol.hashtags, function (value, key) {
			hashtagsToCheck.push(_this.checkHashtagState(value));
		});

		return Promise.all(
			hashtagsToCheck
		)
		.then(function () {
			resolve();
		});
	});


};

exports.checkHashtagState = function (hashtag) {

	return new Promise(function (resolve, reject) {

		console.log('setupController: checkState: Checking state for ' + hashtag.tagname);

		State.load(hashtag._id, 'today', function (err, currentState) {

			//if we can find state, great
			if (currentState) {
				console.log('setupController: checkState: State found for ' +  hashtag.tagname);
				resolve();

			//else create a state in the DB and set to zero
			} else {
				console.log('setupController: checkState: State not found, so creating state myself', hashtag.tagname);

				state.create(hashtag, function (err) {

					if (err) {
						console.log('setupController: checkState: ' + err + ': state not saved\n');
					} else {
						console.log('setupController: checkState: State saved to collection\n');
					}
					resolve();
				});
			}
		});

	});

}

