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

    return Object.entries(placeholders)
        .reduce((carry, [key, placeholder]) => {
            const placeholderRegExp = new RegExp(`{{${key}}}`, 'g');

            return carry.replace(placeholderRegExp, placeholder);
        }, string);
}

export {
    generate
};
