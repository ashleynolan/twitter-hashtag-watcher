
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
	, Promise = require('es6-promise').Promise

	, setup = require('../../app/controllers/setupController')
	, Symbol = mongoose.model('Symbol')
	, State = mongoose.model('State')
	, utils = require('../../lib/utils')
	, _ = require('underscore'),
	_this = this;


/**
 * Load
 */

exports.load = function (req, res, next, id) {
	console.log('questionController: Loading question from DB');

	Symbol.load(id, function (err, symbol) {
		if (err) {
			return next(err);
		}
		if (!symbol) {
			return next(new Error('not found'));
		}
		req.symbol = symbol;
		next();
	});
};

/**
 * Create a symbol
 */

exports.create = function (symbolName, value) {


	return new Promise(function (resolve, reject) {

		//first we need to check if the symbol already exists in the DB - we don't want duplicates
		Symbol.load(symbolName, function (err, symbol) {

			//if we can't find an id of the same name, it's not in the DB so add it
			if (!symbol) {

				var symbol = new Symbol({
					name:	symbolName
				});

				//loop through hashtags and
				_.each(value.hashtags, function (hashtag) {
					symbol.hashtags.push({
						tagname: hashtag
					});
				});

				console.log('inside loop')
				symbol.save(function () {
					resolve();
				});
			} else {
				//check we don't need to update it with new potential new values if our symbol has changed
				//_this.update(symbol, value, next)
				console.log('Symbol already exists in collection');
				resolve();
			}

		});

	});

};

exports.update = function (symbol, value, next) {

	console.log('Check if ' + symbol.name + ' needed updating');
	var newestHashtags = value.hashtags;
	//so here we need to check if the values we care about are the same or not

	//first, loop through each hashtag currently contained in our symbol
	_.each(symbol.hashtags, function (hashtag) {

		console.log('Checking if ' + hashtag.tagname + 'is present in our most up to date symbol');

		//should make global proto
		var isInArray = Symbol.isInArray(newestHashtags, hashtag.tagname)

		//if it is in the array, then remove it from our list of new hashtags to add to our object
		if (isInArray) {
			var indexInArray = newestHashtags.indexOf(hashtag.tagname);
			newestHashtags.splice(indexInArray, 1);
		}
	});

	//if we still have hashtags left, we need to save these to our symbol
	if (newestHashtags.length > 0) {

		//loop through newHashtags and push onto the array
		_.each(newestHashtags, function (hashtag) {
			symbol.hashtags.push({
				tagname: hashtag
			});
		});

		//symbol.save(next);
	} else {
		next('Symbol already exists in collection');
	}

}

/**
 * Display
 */

exports.display = function(req, res) {

	console.log('questionController: Displaying page:');

	Symbol.loadAll(function (err, symbols) {
		state.getStates(symbols, function (symbolArray) {
			state.stateArrayToObject(symbolArray, function (symbolObject) {

				res.render('layouts/home', {
				title: 'Realtime World Cup',
				symbolsJSON: symbols
			});

			});
		});
	});

	//_this.getAllSymbols(req, res);
};



exports.getAllSymbols = function (req, res) {

	Symbol.loadAll(function (err, symbols) {

		_.each(symbols, function (key, value) {

			console.log(key, value);

		});
		//setup.getState(function (state) {

			// console.log(state);
			//reduce tags into associated array
			// var tags = _.reduce (state.tags, function (reduced, item) {
			// 	reduced[item.tag] = item;
			// 	return reduced;
			// }, {});

			// res.render('layouts/symbol', {
			// 	symbol: symbol,
			// 	state: state,
			// 	tags: tags
			// });
			//
			res.render('layouts/home', {
				title: 'Realtime World Cup',
				symbolsJSON: symbols
			});

		//});

	});


}



