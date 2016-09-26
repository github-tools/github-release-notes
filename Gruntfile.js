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
				src: ['README.md', 'src/*.js'],
				readme: 'README.md',
				version: true,
				options: {
					destination: 'docs',
					template : "node_modules/ink-docstrap/template",
					configure : "node_modules/ink-docstrap/template/jsdoc.conf.json"
				}
			}
		}
	});

	grunt.registerTask('ship', ['jshint', 'jsdoc']);
	grunt.registerTask('test', ['jshint', 'nodeunit']);
};