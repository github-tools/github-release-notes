'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.initConfig({
        nodeunit: {
            all: ['test/**/*.js']
        },
        eslint: {
            options: {
                fix: true
            },
            target: [
                'Gruntfile.js',
                'src/**/*.js'
            ]
        }
    });

    grunt.registerTask('test', ['eslint', 'nodeunit']);
};
