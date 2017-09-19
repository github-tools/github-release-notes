#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _package = require('../package.json');

var _utils = require('../dest/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.version(_package.version).description(_package.description).usage('[command] [options]').command('release', 'Release into chunk').alias('r').command('changelog', 'Write a motherfucking changelog').alias('c').on('--help', function () {
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('    $ gren release');
    console.log('');
    console.log('    $ gren help release');
    console.log('');
}).parse((0, _utils.argvWithVersion)(process.argv));