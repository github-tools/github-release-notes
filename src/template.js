'use strict';

function generate(placeholders, string) {
    return Object.keys(placeholders)
        .reduce(function(carry, placeholder) {
            var placeholderRegExp = new RegExp('{{' + placeholder + '}}', 'g');

            return carry.replace(placeholderRegExp, placeholders[placeholder]);
        }, string);
}

module.exports = {
    generate: generate
};
