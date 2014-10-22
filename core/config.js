
var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	config,
	sharedConfig;

var sharedConfig = {
	root: rootPath,
	db : {
		path: 'mongodb://localhost/realtime-worldcup'
	}
};

module.exports = {
	local: {
		mode: 'local',
		port: 3002,
		app: {
			name: 'Twitter vote counter - local'
		},
		twitter: require('./privconfig-twitter')['local'],
		global: sharedConfig
	},

	dev: {
		mode: 'development',
		port: 3002,
		app: {
			name: 'Twitter vote counter - Dev'
		},
		twitter: require('./privconfig-twitter')['dev'],
		global: sharedConfig
	},

	prod: {
		mode: 'production',
		port: 3002,
		app: {
			name: 'Twitter vote counter - Prod'
		},
		twitter: require('./privconfig-twitter')['prod'],
		global: sharedConfig

	},

	hosts: [
		{
			domain: 'twitterpoll.local',
			target: ['localhost:3001']
		}
	]
};
