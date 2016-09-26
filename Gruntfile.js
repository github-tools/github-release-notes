'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-jsdoc');
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
        },
        jsdoc: {
            dist: {
                src: ['README.md', 'src/*.js'],
                readme: 'README.md',
                version: true,
                options: {
                    destination: 'docs',
                    template: 'node_modules/ink-docstrap/template',
                    configure: 'node_modules/ink-docstrap/template/jsdoc.conf.json'
                }
            }
        }
    });

    grunt.registerTask('ship', ['eslint', 'jsdoc']);
    grunt.registerTask('test', ['eslint', 'nodeunit']);
};
