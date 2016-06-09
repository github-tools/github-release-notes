'use strict';

module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	grunt.initConfig({
		nodeunit: {
			all: ['test/**/*.js']
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc',
			},
			src: [
				'Gruntfile.js',
				'src/**/*.js'
			]
		},
		jsdoc : {
			dist : {
				src: ['src/*.js', 'README.md'],
				options: {
					destination: 'docs'
				}
			}
		}
	});

	// grunt.registerTask('ship', ['jshint', 'jsdoc']);
	grunt.registerTask('test', ['jshint', 'nodeunit']);
};