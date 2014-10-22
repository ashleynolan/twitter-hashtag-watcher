
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
	, Promise = require('es6-promise').Promise

	, State = mongoose.model('State')
	, utils = require('../../lib/utils')
	, _ = require('underscore')
	, _this = this;



/**
 * Create a question
 */

exports.create = function (hashtag, cb) {

	var now = new Date(),
		today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	var state = new State({
		hashtag					:	hashtag._id,
		name					:	hashtag.tagname,
		date					:	today,
		count					:	0
	});

	state.save(cb);
}



exports.getStates = function (symbols) {

	return new Promise(function (resolve, reject) {

		var symbolStates = [];

		//for each symbol
		_.each(symbols, function (symbol, key) {
			symbolStates.push(_this.getSymbolState(symbol));
		});

		return Promise.all(
			symbolStates
		).then(function () {
			resolve(symbols);
		});

	});
}

exports.getSymbolState = function (symbol) {

	return new Promise(function (resolve, reject) {

		var hashtagStates = [];

		//and then for each hashtag
		_.each(symbol.hashtags, function (hashtag, j) {
			hashtagStates.push(_this.getHashtagState(hashtag));
		});

		return Promise.all(
			hashtagStates
		).then(function () {
			resolve();
		});
	});

}

exports.getHashtagState = function (hashtag) {

	return new Promise(function (resolve, reject) {

		State.load(hashtag._id, 'today', function (err, currentState) {
			//states[key].hashtags[j].state = currentState;
			hashtag.state = currentState;
			resolve(hashtag);
		});

	});

}


/**
	Transformation function
	Loops through our array of symbols and hashtags to convert into an object of format:

	{
		brazil : {
			hashtags : {
				'#BRA' : {
					count: 0
				}
			},
			total : 0
		}
	}
*/
exports.stateArrayToObject = function (states) {

	return new Promise(function (resolve, reject) {

		var stateObject = {};

		_.each(states, function (symbol) {

			stateObject[symbol.name] = {
				hashtags : {},
				total : 0
			}

			_.each(symbol.hashtags, function (hashtag) {
				stateObject[symbol.name].hashtags[hashtag.tagname] = {
					count : hashtag.state.count
				}

				stateObject[symbol.name].total += stateObject[symbol.name].hashtags[hashtag.tagname].count;
			})
		});

		resolve(stateObject);
	});
}

/**
 * Make state a more readable format than how it comes back from the DB
 */

exports.makeStateReadable = function (states) {

	//console.log('stateController: makeStateReadable')

	var readableStates = {};

	for (var stateNum in states) {

		var state = states[stateNum],
			QID = state.question.questionURL;

		readableStates[QID] = {
			question : states[stateNum].question,
			tagsData : {},
			totalVotes : state.totalVotes,
			date : state.date
		};


		//loop through each tag
		_.each(state.tags, function (tag, j) {
			readableStates[QID].tagsData[tag.tag] = tag;
		});
	}

	//state
	return readableStates;

}


exports.updateAllStates = function (globalState, cb) {

	//console.log('stateController: updateAllStates');
	var controller = this,
		stateSavedCounter = 0,
		stateLength = Object.keys(globalState).length;

	for (var state in globalState) {

		loadState(globalState[state]);

	}


	//function created to create a closure around relevantState so we can pass it through once our callback is executed
	function loadState(relevantQuestion) {
		//load the state of the same id
		State.load(relevantQuestion.question._id, 'today', function (err, currentState) {

			//should do something here to handle when the day changes - at the moment it errors out (which is fine) and restarts server, would be better if was more seamless and handled it here
			if (err === null) {
				controller.updateState(relevantQuestion, currentState, function() {
					stateSavedCounter++;

					if (stateSavedCounter === stateLength) {
						cb('All states saved');
					}
				});
			}

		});
	}


}

exports.updateState = function (newState, currentState, cb) {

	//update with the current state with the new state values

	currentState.totalVotes = newState.totalVotes;

	//loop through tags and update
	for (var i=0; i < currentState.tags.length; i++) {
		var tagState = currentState.tags[i],
			tagId = tagState.tag,
			newTagState = newState.tagsData[tagId];

		//update values
		tagState.votes = newTagState.votes;
		tagState.percentage = newTagState.percentage;
	}

	//and then save back to the db
	currentState.save(
		function (err, product, numAffected) {
			if (err !== null) {
				console.log(err);
			} else {
				console.log('Successfully updated DB: ', newState.question.questionURL, newState.totalVotes);
			}
			cb();
		}
	);

}


