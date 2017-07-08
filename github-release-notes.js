'use strict';

var GithubReleaseNotes = require('./src/gren');
var utils = require('./src/utils');
var options = utils.getBashOptions(process.argv);
var gren = new GithubReleaseNotes(options);

gren.init()
    .then(function() {
        return gren[option.action]();
    })
    .catch(function(error) {
        utils.clearTasks(gren);

        console.error(error);
    });
