
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	Promise = require('es6-promise').Promise,

	State = mongoose.model('State'),
	utils = require('lib/utils'),
	_ = require('underscore'),
	_this = this;



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
};


//Loops through each symbol and gets the state of each in turn
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
};

//gets the state of the symbol passed to the function
//does this by looping through the tags associated with it and getting their state
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

		//{ tagname: 'yuletide', _id: 5460e183cf25cedd563ff8b5 }

		State.load(tag._id, 'today', function (err, currentState) {
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
			tags : {
				'brazil' : {
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
				id : symbol._id,
				tags : {},
				total : 0
			};

			_.each(symbol.tags, function (tag) {
				stateObject[symbol.name].tags[tag.tagname] = {
					id : tag._id,
					count : tag.state.count
				};

				stateObject[symbol.name].total += stateObject[symbol.name].tags[tag.tagname].count;
			});
		});

		resolve(stateObject);
	});
};

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

};


//updates the state of each tag (tags store states not symbols)
exports.updateAllStates = function (globalState) {

	return new Promise(function (resolve, reject) {

		//console.log('stateController: updateAllStates');

		var tagStates = []; //array to store requested promises

		//loop through each symbol
		for (var symbol in globalState) {
			var tags = globalState[symbol].tags;
			//and then through each tag in that symbol – states are stored on tag ids, not symbols
			for (tag in tags) {
				tagStates.push(_this.loadState(tag, tags[tag]));
			}
		}

		return Promise.all(
			tagStates
		).then(function (msg) {
			resolve(msg[0]);
		});
	});


};

//load the state of the relevant tag
exports.loadState = function (tagName, tagState) {

	return new Promise(function (resolve, reject) {
		//console.log('server/controllers/state :: loadState :: ' + tagName);

		//load the state of the same id
		State.load(tagState.id, 'today', function (err, dbState) {
			if (err === null) {
				_this.updateState(tagState, dbState, function(msg) {
					resolve(msg);
				});
			}
		});
	});


};

exports.updateState = function (newState, dbState, cb) {

	//Need to check the dbState
	//if dbState is null, then it means that we cannot find a state because it’s past 12pm and there is no longer a state available
	//so save the state for the yesterday as the final update
	//then create a new state for the new instance of today (as it’s now a new day), and then pass back msg
	//to our main update saying to clear the local state held by the server back to zero
	if (dbState === null) {

		//first save the state for yesterday before we switch
		State.load(newState.id, 'yesterday', function (err, yestState) {

			console.log('stateController :: updateState.js :: yesterday');

			if (err === null) {
				//update yesterdays final state
				_this.updateState(newState, yestState, function() {
					newState.tagname = yestState.name;
					newState._id = newState.id;
					//create new state for today
				 	_this.create(newState, function () {
				 		cb('Clear local server state');
				 	});
				});
			}

		});

	} else {
		//update with the current state with the new state values
		dbState.count = newState.count;

		//and then save back to the db
		_this.saveHandler(dbState, cb);
	}

};

exports.saveHandler = function (dbState, cb) {

	dbState.save(
		function (err, product, numAffected) {
			if (err !== null) {
				console.log(err);
			} else {
				//console.log('Successfully updated DB: ');
			}
			cb('State saved');
		}
	);

};


