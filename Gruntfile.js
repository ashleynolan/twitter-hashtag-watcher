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

				// <%=config.js.fileList%>
				fileList : [
					'public/js/libs/underscore.min.js',
					'public/js/helpers/log.js', //log helper
					'public/js/helpers/min.js', //minimal selector code - swap out for jQuery if you want something with more oomph

					'public/js/script.js',
				]
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
		'uglify',
		'sass:kickoff',
		'autoprefixer:kickoff'
	]);

	// A task for deployment
	grunt.registerTask('deploy', [
		'uglify',
		'sass:kickoff',
		'autoprefixer:kickoff',
		'csso'
	]);

	// Default task
	grunt.registerTask('default', [
		'uglify',
		'sass:kickoff',
		'autoprefixer:kickoff'
	]);

};
