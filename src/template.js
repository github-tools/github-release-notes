'use strict';

/**
 * Generate the templated string based on
 * a placeholders Object
 *
 * @since  0.6.0
 * @private
 *
 * @param  {Object} placeholders All the keys/values to update
 * @param  {string|Function} string The string or the function that needs to be replaced
 *
 * @return {string}
 */
function generate(placeholders, string) {
    if (typeof string === 'function') {
        return string(placeholders);
    }

    return Object.keys(placeholders)
        .reduce(function(carry, placeholder) {
            var placeholderRegExp = new RegExp('{{' + placeholder + '}}', 'g');

            return carry.replace(placeholderRegExp, placeholders[placeholder]);
        }, string);
}

module.exports = {
    generate: generate
};
