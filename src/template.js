'use strict';

var config = require('../templates.json');
var ObjectAssign = require('deep-assign');
var options = ObjectAssign({}, config, {});

function generate(placeholders, string) {
    return Object.keys(placeholders)
        .reduce(function(carry, placeholder) {
            var placeholderRegExp = new RegExp(placeholder, 'g');

            return carry.replace(placeholderRegExp, placeholders[placeholder]);
        }, string);
}

module.exports = {
    options: options,
    generate: generate
};
