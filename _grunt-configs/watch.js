module.exports.tasks = {

	/**
	* Watch
	* https://github.com/gruntjs/grunt-contrib-watch
	* Watches your scss, js etc for changes and compiles them
	*/
	watch: {
		scss: {
			files: ['<%=config.css.scssDir%>/**/*.scss', '!<%=config.css.scssDir%>/styleguide.scss'],
			tasks: [
				'sass:kickoff',
				'autoprefixer:kickoff'
			]
		},

		js: {
			files: [
				'<%=config.js.jsDir%>/**/*.js',
				'!<%=config.js.distDir%>/**/*.js'
			],
			tasks: ['browserify:dev']
		},

		livereload: {
			options: { livereload: true },
			files: [
				'core/client/views/**/*.jade',
				'<%=config.css.distDir%>/*.css'
			]
		},

		grunticon : {
			files: ['img/src/*.svg', 'img/src/*.png'],
			tasks: [
				'clean:icons',
				'svgmin',
				'grunticon'
			]
		},

		grunt: {
			files: [
				'_grunt-configs/*.js',
				'Gruntfile.js'
			]
		}
	}
};
