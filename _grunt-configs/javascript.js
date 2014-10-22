module.exports.tasks = {

	/**
	 * Uglify
	 * https://github.com/gruntjs/grunt-contrib-uglify
	 * Minifies and concatinates your JS
	 * Also creates source maps
	 */
	uglify: {
		options: {
			mangle: { // set to false (replace this object) to turn off mangling
				except: ['jQuery'] // https://github.com/gruntjs/grunt-contrib-uglify#reserved-identifiers
			},
			compress: { // set to false (replace this object) to turn off compression
				drop_console: false
			},

			beautify: false, // beautify: beautify your code for debugging/troubleshooting purposes
			// report: 'gzip', // report: Show file size report
			sourceMap: '<%=config.js.distDir%><%=config.js.distFile%>.map',
			sourceMappingURL: '/<%=config.js.distFile%>.map',
		},
		js: {
			nonull: true,
			src: '<%=config.js.fileList%>',
			dest: '<%=config.js.distDir%><%=config.js.distFile%>'
		}
	}
};
