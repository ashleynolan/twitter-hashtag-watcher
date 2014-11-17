
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var mongoose = require('mongoose'),
	twitter = require('twitter'), //ntwitter - allows easy JS access to twitter API's - https://github.com/AvianFlu/ntwitter
	_ = require('underscore'),
	fs = require('fs'),

	SocketServer = null,
	Symbol = mongoose.model('Symbol'),
	State = mongoose.model('State'),
	state = require('./stateController'),

	pkg = require('package.json'),

	FAKE_TWITTER_CONNECTION = false,
	SAVE_TWEETS_TO_FILE = false,
	SERVER_BACKOFF_TIME = 30000,
	TEST_TWEET_TIMER = 50,

	_this = this;


var TwitterController = {

	twitterStreamingApi : null,
	tags : null,

	testData : {
		tweetStream : null,
		numberOfTweets : null
	},


	state : {
		totalTweets : 0,
		symbols : null
	},


	/*
	 * Initalises our twitter link
	 * Stores our socketServer for use when emitting
	 * Opens a context for the twitter streaming API and opens a stream to Twitter
	 */
	init : function (socketServer, config) {

		SocketServer = socketServer; //assigning passed instance of our socket connection to use when we need to emit

		_self.twitterStreamingApi = new twitter(config.twitter); //Instantiate the twitterStreamingAPI component

		return TwitterController;

	},

	/*
	 * Opens connection to the twitter Streaming API
	 */
	openStream : function () {
		console.log('\ntwitterAPILink :: openStream');

		_self.getLocalStateFromServer(_self.createStream);
	},


	createStream : function () {

		console.log('twitterAPILink :: createStream\n');

		// if we’re in 'dev' mode, we’ll fake the tweets coming in
		// This is done using a json file we’ve populated with a load of tweets and we’ll randomly choose them at regular intervals
		// to simulate the connection to twitter
		//
		// This is to stop us getting blocked by Twitter when we’re changing our node server during development
		if (FAKE_TWITTER_CONNECTION) {

			fs.readFile('core/server/test/tweets.json', function (err, data) {
				if (err) throw err;
				//no error = found json object


				_self.testData.tweetStream = JSON.parse(data);
				_self.testData.numberOfTweets = _self.testData.tweetStream.length;

				// pick a random tweet every 5 milliseconds
				setInterval(_self.receiveTestTweet, TEST_TWEET_TIMER);
			});

		} else {

			var tweet,
				tweetText;

			//Tell the twitter API to filter on the watchSymbols
			_self.twitterStreamingApi.stream('statuses/filter', { track: _self.tags }, function(stream) {

				//We have a connection. Now watch the 'data' event for incomming tweets.
				stream.on('data', _self.dataReceived);

				//catch any errors from the streaming API
				stream.on('error', function(error) {
					console.log("twitterAPILink :: My error: ", error);

					//try reconnecting to twitter in 30 seconds
					setTimeout(function () {
						_self.createStream();
					}, SERVER_BACKOFF_TIME);

				});
				stream.on('end', function (response) {
					// Handle a disconnection
					console.log("twitterAPILink :: Disconnection: ", response.statusCode);

					//try reconnecting to twitter in 30 seconds
					setTimeout(function () {
						_self.createStream();
					}, SERVER_BACKOFF_TIME);

				});
				stream.on('destroy', function (response) {
					// Handle a 'silent' disconnection from Twitter, no end/error event fired
					console.log("twitterAPILink :: Destroyed: ", response);

					//try reconnecting to twitter in 30 seconds
					setTimeout(function () {
						_self.createStream();
					}, SERVER_BACKOFF_TIME);
				});
			});
		}
		_self.setupStateSaver();
	},

	receiveTestTweet : function () {

		var randomInt = Math.floor(Math.random() * _self.testData.numberOfTweets);

		var randomTweet = _self.testData.tweetStream[randomInt];

		//send tweet to our data received function
		_self.dataReceived(randomTweet);

	},


	//this function is called any time we receive some data from the twitter stream
	//we go through the tags, work out which one was mentioned, and then update our tracker
	dataReceived : function (data) {
		//console.log('twitterAPILink :: dataReceived');

		//Since twitter doesnt know why the tweet was forwarded we have to search through the text
		//and determine which hashtag it was meant for. Sometimes we can't tell, in which case we don't
		//want to increment the total counter...

		//Make sure it was a valid tweet
		if (data.text !== undefined) {

			// first check if we’re saving tweets down for test data
			// if true, save to our test JSON file
			if (SAVE_TWEETS_TO_FILE) {
				_self.saveTweetToFile(data);
			}

			//Build up a smaller element of data that we want to use from the mammoth tweet data we receive
			tweet = {
				symbol: null,
				time: null,
				textRaw: data.text,
				country: '',
				text: data.text.toLowerCase()
			};

			_self.matchTweetToTags(tweet);
		}
	},

	saveTweetToFile : function (tweet) {

		fs.appendFile('core/server/test/tweets.json', JSON.stringify(tweet) + ',', function (err) {
			if (err) throw err;
			//no error = saved
		});

	},

	matchTweetToTags : function (tweet) {

		var validTweet = false;

		//Go through each tracker objects set of tags and check if it was mentioned. If so, increment the hashtag counter, the total objects counter and
		//set the 'claimed' variable to true to indicate something was mentioned so we can increment
		//the 'totalTweets' counter in our state
		_.each(_self.state.symbols, function(symbol) {

			//for each symbol, we could be monitoring multiple tags, so loop through these also
			_.each(symbol.tags, function(value, tag) {

				var reg = new RegExp('.*\\b' + tag + '\\b.*')

				//do a regex match here so that we match the exact tag
				if (tweet.text.match(reg) !== null) {
					_self.updateSymbol(symbol, tag);

					validTweet = true;

					//console.log(symbol);
				}
			});
		});

		//if the tweet was claimed by at least one symbol
		if (validTweet) {
			_self.state.total++;
		}

		_self.emitState();

	},

	//update the symbols counts
	updateSymbol : function (symbol, tag) {

		var symbolValues = symbol.tags[tag];

		//increment the hashtag total for the symbol
		symbolValues.count++;

		//increment the symbols total votes
		symbol.total++;

	},

	//we want to convert out state to an easier to read format for the javascript on the other side
	emitState : function () {
		//emit our tweet
		SocketServer.sockets.emit('tweet', _self.state.symbols);
	},

	//updates the states in the DB every x seconds
	setupStateSaver : function () {
		//set to update every x seconds (set in constants at the top of this file)
		setInterval(function () {
			_self.saveState();
		}, 5000);
	},

	saveState : function () {
		//save our states
		state.updateAllStates(_self.state.symbols)
		.then(function (msg) {
			console.log('State saved at ' + new Date());
			//if we get a message to clear our local state, reload the state from the server
			if (msg === 'Clear local server state') {
				_self.getLocalStateFromServer();
			}
		});
	},

	getLocalStateFromServer : function (cb) {

		Symbol.loadAll(function (err, symbols) {
			state.getStates(symbols)
			.then(
				state.stateArrayToObject
			)
			.then(function (symbolObject) {
				_self.state.symbols = symbolObject;

				_self.tags = state.getTags(symbols);

				if (cb !== null)
					cb();
			});
		});

	}


};

Array.prototype.has = function (value) {
	return this.indexOf(value) > -1;
};


var _self = TwitterController;

module.exports = TwitterController;




