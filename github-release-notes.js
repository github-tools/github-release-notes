'use strict';

var GithubReleaseNotes = require('./src/gren');
var gren = new GithubReleaseNotes();
var utils = require('./src/util');

var action = utils.getOptions(process.argv)['action'];

gren.init(action || 'release');