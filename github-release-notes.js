'use strict';

var GithubReleaseNotes = require('./src/gren');
var gren = new GithubReleaseNotes();
var utils = require('./src/utils');

var action = utils.getBashOptions(process.argv)['action'];

gren.init()
	.then(function (success) {
		if(success) {
			return gren[action || 'release']();
		}
	});
