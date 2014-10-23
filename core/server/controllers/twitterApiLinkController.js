
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var mongoose = require('mongoose'),
	twitter = require('twitter'), //ntwitter - allows easy JS access to twitter API's - https://github.com/AvianFlu/ntwitter
	_ = require('underscore'),

	SocketServer = null,
	Symbol = mongoose.model('Symbol'),
	State = mongoose.model('State'),
	state = require('./stateController'),

	pkg = require('package.json'),

	FAKE_TWITTER_CONNECTION = false,
	SERVER_BACKOFF_TIME = 30000,

	_this = this;


var TwitterController = {

	twitterStreamingApi : null,

	state : {
		totalTweets : 0
	},


	/*
	 * Initalises our twitter link
	 * Stores our socketServer for use when emitting
	 * Opens a context for the twitter streaming API and opens a stream to Twitter
	 */
	init : function (app, socketServer, config) {

		SocketServer = socketServer; //assigning passed instance of our socket connection to use when we need to emit

		//_self.twitterStreamingApi = new twitter(config.twitter); //Instantiate the twitterStreamingAPI component

		return TwitterController;

	},

	/*
	 * Opens connection to the twitter Streaming API
	 */
	openStream : function () {
		console.log('twitter.js: Opening Stream');

		Symbol.loadAll(function (err, symbols) {

			state.getStates(symbols)
			.then(
				state.stateArrayToObject
			)
			.then(function (symbolObject) {
				tracker = symbolObject;
				t.createStream();
			});

		});

	},


	getTagsFromTrackingObject : function () {

		//loop through each category of tracker
		_.each(tracker, function (val, symbol) {

			//loop through the array of tags and push them onto the tags array if they aren't already there
			_.each(val.hashtags, function (val, hashtagName) {
				pushToTagArray(val, hashtagName);
			});
		});

		return tags;
	},

	pushToTagArray : function (val, tag) {
		var exists = tags.has(tag);

		//if the value doesn't exist in our array
		if (!exists) {
			tags.push(tag);
		}
	},




	createStream : function () {

		var tweet,
			tweetText;

		tags = getTagsFromTrackingObject(); //temporary until we store the tags in a separate config area

		console.log('twitter.js: Watching tags: ', tags);

		//Tell the twitter API to filter on the watchSymbols
		// t.stream('statuses/filter', { track: tags }, function(stream) {

		// 	//We have a connection. Now watch the 'data' event for incomming tweets.
		// 	stream.on('data', t.dataReceived);
		// 	//catch any errors from the streaming API
		// 	stream.on('error', function(error) {
		// 		console.log("twitter.js: My error: ", error);

		// 		//try reconnecting to twitter in 30 seconds
		// 		// setTimeout(function () {
		// 		// 	t.openStream();
		// 		// }, 30000);

		// 	});
		// 	stream.on('end', function (response) {
		// 		// Handle a disconnection
		// 		console.log("twitter.js: Disconnection: ", response.statusCode);

		// 		//try reconnecting to twitter in 30 seconds
		// // 		setTimeout(function () {
		// // 			t.openStream();
		// // 		}, 30000);

		// 	});
		// 	stream.on('destroy', function (response) {
		// 		// Handle a 'silent' disconnection from Twitter, no end/error event fired
		// 		console.log("twitter.js: Destroyed: ", response);

		// 		//try reconnecting to twitter in 30 seconds
		// // 		setTimeout(function () {
		// // 			t.openStream();
		// // 		}, 30000);
		// 	});
		// });

		//dev only
		setInterval(function () {
			t.dataReceived({
				text : '@dishmx #elfutbolesdetodos #mex 6 #bra 5'
			});
		}, 500);

		//t.setupStateSaver();
	},


	//this function is called any time we receive some data from the twitter stream
	//we go through the tags, work out which one was mentioned, and then update our tracker
	dataReceived : function (data) {
		//console.log('twitter.js: receiving');

		//Since twitter doesnt know why the tweet was forwarded we have to search through the text
		//and determine which hashtag it was meant for. Sometimes we can't tell, in which case we don't
		//want to increment the total counter...

		//Make sure it was a valid tweet
		if (data.text !== undefined) {

			//We're gunna do some indexOf comparisons and we want it to be case agnostic, whatever that means
			tweet = {
				symbol: null,
				time: null,
				text: data.text,
				country: ''
			},
			tweetText = data.text.toLowerCase();
			//console.log(tweetText);

			t.matchTweetToHashtags(tweetText);
		}
	},

	matchTweetToHashtags : function () {

		var validTweet = false;

		//Go through each tracker objects set of hashtags and check if it was mentioned. If so, increment the hashtag counter, the total objects counter and
		//set the 'claimed' variable to true to indicate something was mentioned so we can increment
		//the 'totalTweets' counter in our state
		_.each(tracker, function(symbol) {

			//for each symbol, we could be monitoring multiple hashtags, so loop through these also
			_.each(symbol.hashtags, function(value, hashtag) {

				if ((tweetText.toLowerCase()).indexOf(hashtag.toLowerCase()) !== -1) {

					t.updateSymbol(symbol, hashtag);

					validTweet = true;

					//console.log(symbol);
				}
			});
		});

		//if the tweet was claimed by at least one symbol
		if (validTweet) {
			currentState.totalTweets++;
		}
		//t.emitReadableState();

	},

	//update the symbols counts
	updateSymbol : function (symbol, hashtag) {

		var symbolValues = symbol.hashtags[hashtag];

		//increment the hashtag total for the symbol
		symbolValues.count++;

		//increment the symbols total votes
		symbol.total++;

	},

	//we want to convert out state to an easier to read format for the javascript on the other side
	emitReadableState : function () {
		//emit our tweet
		socketServer.sockets.emit('tweet', globalState.currentGlobalState);
	},

	//updates the states in the DB every x seconds
	setupStateSaver : function () {
		//set to update every 10 seconds
		setInterval(function () {
			_self.saveState(function (msg) {
				console.log(msg);
			});
		}, 10000);
	},

	saveState : function (cb) {
		//state.updateAllStates(globalState.currentGlobalState, cb);
	}


};

Array.prototype.has = function (value) {
	return this.indexOf(value) > -1;
};


var _self = TwitterController;

module.exports = TwitterController;




