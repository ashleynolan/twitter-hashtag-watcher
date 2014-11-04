module.exports = function (grunt) {

	'use strict';

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// ====================
	// == config vars =====
	// ====================

	var options = {
		pkg: require('./package'), // <%=pkg.name%>

		/**
		 * Grunt global vars
		 * Many of the Grunt tasks use these vars
		 */
		config : {
			src: "_grunt-configs/*.js",

			css : {
				distDir : 'public/css',     // <%=config.css.distDir%>
				srcFile : 'kickoff', // <%=config.css.srcFile%>
				scssDir : 'public/scss'     // <%=config.css.scssDir%>
			},

			js : {
				distDir  : 'public/js/dist/',   // <%=config.js.distDir%>
				distFile : 'script.min.js', // <%=config.js.distFile%>
				jsDir : 'public/js',     // <%=config.js.jsDir%>
				srcFile : 'script.js', // <%=config.js.srcFile%>
			}
		}
	};

	// Load grunt configurations automatically
	var configs = require('load-grunt-configs')(grunt, options);

	// Define the configuration for all the tasks
	grunt.initConfig(configs);


	// =============
	// === Tasks ===
	// =============
	// A task for development
	grunt.registerTask('dev', [
		'shimly',
		'browserify:dev',
		'sass:kickoff',
		'autoprefixer:kickoff'
	]);

	// A task for deployment
	grunt.registerTask('deploy', [
		'shimly',
		'browserify:prod',
		'sass:kickoff',
		'autoprefixer:kickoff',
		'csso'
	]);

	// Default task
	grunt.registerTask('default', [
		'shimly',
		'browserify:prod',
		'sass:kickoff',
		'autoprefixer:kickoff'
	]);

};
