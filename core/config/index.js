
var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	config,
	sharedConfig;

var sharedConfig = {
	root: rootPath,
	twitter: {
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN,
		access_token_secret: process.env.TWITTER_ACCESS_SECRET
	}
};

module.exports = {
	local: {
		mode: 'local',
		port: 3021,
		app: {
			name: 'Twitter vote counter - local'
		},
		db : {
			path: 'mongodb://localhost/hashtag-watcher'
		},
		global: sharedConfig
	},

	dev: {
		mode: 'development',
		port: 3021,
		app: {
			name: 'Twitter vote counter - Dev'
		},
		db : {
			path: 'mongodb://localhost/hashtag-watcher'
		},
		global: sharedConfig
	},

	prod: {
		mode: 'production',
		port: 3021,
		app: {
			name: 'Twitter vote counter - Prod'
		},
		db : {
			path: 'mongodb://localhost/hashtag-watcher'
		},
		global: sharedConfig

	},

	hosts: [
		{
			domain: 'twitterpoll.local',
			target: ['localhost:3001']
		}
	]
};
