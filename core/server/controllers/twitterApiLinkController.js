
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var mongoose = require('mongoose'),
	twitter = require('twitter'), //ntwitter - allows easy JS access to twitter API's - https://github.com/AvianFlu/ntwitter
	_ = require('underscore'),
	fs = require('fs'),
	getenv = require('getenv'),

	SocketServer = null,
	Symbol = mongoose.model('Symbol'),
	State = mongoose.model('State'),
	state = require('./stateController'),

	pkg = require('package.json'),

	FAKE_TWITTER_CONNECTION = getenv.bool('FAKE_TWITTER_CONNECTION', false),
	SAVE_TWEETS_TO_FILE = false,
	SERVER_BACKOFF_TIME = 30000,
	TEST_TWEET_TIMER = 10,
	STATE_SAVE_DURATION = 600000,

	_this = this;


var TwitterController = {

	activeStream : null,

	twitterStreamingApi : null,
	tags : null,

	testData : {
		tweetStream : null,
		numberOfTweets : null
	},

	saveTimer : null,
	emitLimit : false,

	state : {
		totalTweets : 0,
		symbols : null
	},

	historicState : {

	},


	/*
	 * Initalises our twitter link
	 * Stores our socketServer for use when emitting
	 * Opens a context for the twitter streaming API and opens a stream to Twitter
	 */
	init : function (socketServer, config) {

		SocketServer = socketServer; //assigning passed instance of our socket connection to use when we need to emit

		_self.twitterStreamingApi = new twitter(config.global.twitter); //Instantiate the twitterStreamingAPI component

		return TwitterController;

	},

	/*
	 * Opens connection to the twitter Streaming API
	 */
	openStream : function () {
		console.log('\ntwitterAPILink :: openStream');

		_self.getLocalStateFromServer(_self.createStream);

		// _self.getHistoricState();
	},


	createStream : function () {

		console.log('twitterAPILink :: createStream\n');

		// if we’re in 'dev' mode, we’ll fake the tweets coming in
		// This is done using a json file we’ve populated with a load of tweets and we’ll randomly choose them at regular intervals
		// to simulate the connection to twitter
		//
		// This is to stop us getting blocked by Twitter when we’re changing our node server during development
		if (FAKE_TWITTER_CONNECTION) {
			console.log('!!!!!!!!!!!FAKE–TWITTER–CONNECTION!!!!!!!!!!');

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
			_self.twitterStreamingApi.stream('statuses/filter', { track: _self.tags }, _self.onStreamConnect);

		}

		if (_self.saveTimer === null) {
			_self.setupStateSaver();
		}
	},


	onStreamConnect : function (stream) {

		_self.activeStream = stream;

		//We have a connection. Now watch the 'data' event for incomming tweets.
		stream.on('data', _self.dataReceived);

		//catch any errors from the streaming API
		stream.on('error', _self.onStreamError);
		stream.on('end', _self.onStreamEnd);
		stream.on('destroy', _self.onStreamDestroy);

	},

	onStreamError : function (error) {
		console.log("twitterAPILink :: My error: ", error);
		setTimeout(_self.createStream, SERVER_BACKOFF_TIME); //try reconnecting to twitter in 30 seconds
	},

	// Handle a disconnection
	onStreamEnd : function (response) {
		console.log("twitterAPILink :: Disconnection: ", response.statusCode);
		// _self.activeStream.destroy();
		setTimeout(_self.createStream, 2000); //try reconnecting to twitter in 2 seconds to give db chance to save

	},

	// Handle a 'silent' disconnection from Twitter, no end/error event fired
	onStreamDestroy : function (response) {
		console.log("twitterAPILink :: Destroyed: ", response);
		setTimeout(_self.createStream, SERVER_BACKOFF_TIME); //try reconnecting to twitter in 30 seconds
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

		//Remember, that must add [] around JSON once captured to use as test data
		fs.appendFile('core/server/test/tweets.json', JSON.stringify(tweet) + ',', function (err) {
			if (err) throw err;
			//no error = saved
		});

	},

	matchTweetToTags : function (tweet) {

		var validTweet = false,
			reg,
			symbol, symbolKey,
			tag;

		//Go through each tracker objects set of tags and check if it was mentioned. If so, increment the hashtag counter, the total objects counter and
		//set the 'claimed' variable to true to indicate something was mentioned so we can increment
		//the 'totalTweets' counter in our state
		for (symbolKey in _self.state.symbols) {
			symbol = _self.state.symbols[symbolKey];
			//for each symbol, we could be monitoring multiple tags, so loop through these also

			for (tag in symbol.tags) {

				reg = new RegExp('.*\\b' + tag.toLowerCase() + '\\b.*');

				// //do a regex match here so that we match the exact tag
				if (tweet.text.match(reg) !== null) {
					_self.updateSymbol(symbol, tag);

					_self.emitLimiter({
						'symbol' : symbol,
						'key' : symbolKey
					});
					validTweet = true;
				}
			}
		}

		//if the tweet was claimed by at least one symbol
		if (validTweet) {
			_self.state.total++;
		}
	},

	//update the symbols counts
	updateSymbol : function (symbol, tag) {

		//increment the specific tag total for the symbol
		symbol.tags[tag].count++;

		//increment the symbols total votes
		symbol.total++;

	},

	//we want to convert out state to an easier to read format for the javascript on the other side
	emitState : function () {
		//emit our tweet
		SocketServer.sockets.emit('tweet', _self.state.symbols);
	},


	//emit limiter makes sure we don’t hammer our front-end, so we only emit every x ms
	//then the rest will be updated once the state save every STATE_SAVE_DURATION
	emitLimiter : function (symbolObj) {

		//if we’ve hit our emit limit, return
		if (_self.emitLimit === true) {
			return;
		}

		_self.emitLimit = true;
		//emit our tweet to our client FE server

		// SocketServer.client.emit('tweet', symbolObj);
		SocketServer.sockets.emit('tweet', symbolObj);

		//reset emitLimiter after x ms
		setTimeout(function () {
			_self.emitLimit = false;
		}, 100);

	},


	//updates the states in the DB every x seconds
	setupStateSaver : function () {
		//set to update every x seconds (set in constants at the top of this file)
		_self.saveTimer = setInterval(_self.saveState, STATE_SAVE_DURATION);
	},

	saveState : function () {
		console.log('Starting Save process at ' + new Date());

		//first destroy our stream – so we aren’t competing for CPU while saving state
		_self.activeStream.destroy();

		//save our states
		state.updateAllStates(_self.state.symbols)
		.then(function (msg) {
			console.log('State saved at ' + new Date());
			console.log(msg);

			//if we get a message to clear our local state, reload the state from the server
			if (msg === 'Clear local server state') {
				console.log('Clearing local state – switching to new day');
				_self.getLocalStateFromServer(_self.createStream);
			} else {
				SocketServer.sockets.emit('symbolState', _self.state); //emit new state for our front end to save in state
				// SocketServer.client.emit('symbolState', _self.state);
			}
		});
	},

	getLocalStateFromServer : function (cb) {

		Symbol.loadAll(function (err, symbols) {
			state.getStates(symbols, 'recent')
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

	},

	//at later date, should move this inline with the normal state function and merge the two functions
	// doesn’t make sense to keep separate as doing some of the same things twice
	getHistoricState : function () {

		console.log('GETTING HISTORIC STATE!');

		//load all of our symbols
		//
		//then we need to get historical state for each one – needs new function to get all related states for each function
		//
		//then convert into an object we can understand

		Symbol.loadAll(function (err, symbols) {
			if (err) console.log(err);

			state.getStates(symbols, 'all')
			.then(
				state.stateArrayToObject
			);
		});
	}


};

Array.prototype.has = function (value) {
	return this.indexOf(value) > -1;
};


var _self = TwitterController;

module.exports = TwitterController;




