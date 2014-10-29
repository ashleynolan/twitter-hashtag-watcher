
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
	, Promise = require('es6-promise').Promise

	, State = mongoose.model('State')
	, utils = require('lib/utils')
	, _ = require('underscore')
	, _this = this;



/**
 * Create a question
 */

exports.create = function (tag, cb) {

	var now = new Date(),
		today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	var state = new State({
		tag					:	tag._id,
		name				:	tag.tagname,
		date				:	today,
		count				:	0
	});

	state.save(cb);
}



exports.getStates = function (symbols) {

	return new Promise(function (resolve, reject) {

		console.log('\nserver/controllers/state :: getStates');

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

		var tagStates = [];

		//and then for each hashtag
		_.each(symbol.tags, function (tag, j) {
			console.log('server/controllers/state :: getSymbolState :: ' + tag.tagname);
			tagStates.push(_this.getTagState(tag));
		});

		return Promise.all(
			tagStates
		).then(function () {
			resolve();
		});
	});

};

exports.getTagState = function (tag) {

	return new Promise(function (resolve, reject) {

		State.load(tag._id, 'today', function (err, currentState) {
			//states[key].hashtags[j].state = currentState;
			tag.state = currentState;
			resolve(tag);
		});
	});
};


exports.getTags = function (symbolObj) {

	var tagArray = [];

	_.each(symbolObj, function (symbol) {

		var tags = symbol.tags;

		var numberOfTags = tags.length;
		for (var i=0; i < numberOfTags; i++) {
			tagArray.push(tags[i].tagname);
		}
	});

	return tagArray;

};


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
				tags : {},
				total : 0
			}

			_.each(symbol.tags, function (tag) {
				stateObject[symbol.name].tags[tag.tagname] = {
					count : tag.state.count
				}

				stateObject[symbol.name].total += stateObject[symbol.name].tags[tag.tagname].count;
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


