const chalk = require('chalk');
const fs = require('fs');
const minimist = require('minimist');
require('require-yaml');

/**
 * Sort an object by its keys
 *
 * @since 0.8.0
 * @public
 *
 * @param  {Object} object
 * @return {Object}
 */
function sortObject(object) {
    return Object.keys(object)
        .sort()
        .reduce((result, key) => {
            result[key] = object[key];

            return result;
        }, {});
}

/**
* Print a task name in a custom format
*
* @since 0.5.0
* @public
*
* @param  {string} name The name of the task
*/
function printTask(name) {
    process.stdout.write(chalk.blue(name + ' task:\n===================================\n'));
}
/**
* Outputs the task status
*
* @since 0.5.0
* @public
*
* @param  {string} taskName The task name
*
* @return {Function}          The function to be fired when is loaded
*/
function task(gren, taskName) {
    const time = process.hrtime();
    process.stdout.write(chalk.green(taskName) + ': .');

    gren.tasks[taskName] = setInterval(() => {
        process.stdout.write('.');
    }, 100);

    return function(message) {
        const diff = process.hrtime(time);
        const seconds = ((diff[0] * 1e9 + diff[1]) * 1e-9).toFixed(2);

        process.stdout.write(message || '' + chalk.yellow(' (' + seconds + ' secs)\n'));
        clearInterval(gren.tasks[taskName]);

        gren.tasks[taskName] = seconds;
    };
}

/**
 * Clears all the tasks that are still running
 *
 * @since 0.6.0
 * @public
 *
 * @param  {GithubReleaseNotes} gren
 */
function clearTasks(gren) {
    if (!Object.keys(gren.tasks.length)) {
        return;
    }

    Object.keys(gren.tasks).forEach((taskName) => {
        clearInterval(gren.tasks[taskName]);
    });

    process.stdout.write(chalk.red('\nTask(s) stopped because of the following error:\n'));

    gren.tasks = [];
}

/**
* Check if e value is between a min and a max
*
* @since 0.5.0
* @public
*
* @param  {number}  value
* @param  {number}  min
* @param  {number}  max
*
* @return {Boolean}
*/
function isInRange(value, min, max) {
    return !Math.floor((value - min) / (max - min));
}

/**
* Transforms a dasherize string into a camel case one.
*
* @since 0.3.2
* @public
*
* @param  {string} value The dasherize string
*
* @return {string}       The camel case string
*/
function dashToCamelCase(value) {
    return value
        .toLowerCase()
        .replace(/-([a-z])/g, (match) => match[1].toUpperCase());
}

/**
* Create a literal object of the node module options
*
* @since 0.1.0
* @public
*
* @param  {Array} args The array of arguments (the module arguments start from index 2)
*
* @return {Object}     The object containg the key/value options
*/
function getBashOptions(args) {
    const options = minimist(args.slice(2));
    const settings = {};

    Object.keys(options).forEach((optionName) => {
        if (optionName !== '_') {
            settings[dashToCamelCase(optionName)] = options[optionName];
        }
    });

    return settings;
}

/**
 * Converts an array like string to an actual Array,
 * converting also underscores to spaces
 *
 * @since 0.6.0
 * @public
 *
 * @param  {string} arrayLike The string of items
 * e.g.
 * "wont_fix, duplicate, bug"
 *
 * @return {Array}  The items with spaces instead of underscores.
 */
function convertStringToArray(arrayLike) {
    if (!arrayLike) {
        return [];
    }

    if (typeof arrayLike === 'object') {
        return Object.keys(arrayLike).map((itemKey) => arrayLike[itemKey]);
    }

    return arrayLike
        .replace(/\s/g, '')
        .split(',')
        .map((itemName) => itemName.replace(/_/g, ' ', itemName));
}

/**
* Format a date into a string
*
* @since 0.5.0
* @public
*
* @param  {Date} date
* @return {string}
*/
function formatDate(date) {
    return ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
}

/**
 * Gets the content from a filepath a returns an object
 *
 * @since  0.6.0
 * @public
 *
 * @param  {string} filepath
 * @return {Object|boolean}
 */
function requireConfig(filepath) {
    if (!fs.existsSync(filepath)) {
        return false;
    }

    if (filepath.match(/\./g).length === 1) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }

    return require(filepath);
}

/**
 * Get configuration from the one of the config files
 *
 * @since 0.6.0
 * @public
 *
 * @param  {string} path Path where to look for config files
 * @return {Object} The configuration from the first found file or empty object
 */
function getConfigFromFile(path) {
    return [
        '.grenrc.yml',
        '.grenrc.json',
        '.grenrc.yaml',
        '.grenrc.js',
        '.grenrc'
    ]
        .reduce((carry, filename) => carry || requireConfig(path + '/' + filename), false) || {};
}

// Allow nodeunit to work. Has to be fixed.
module.exports = {
    sortObject,
    printTask,
    task,
    clearTasks,
    getBashOptions,
    dashToCamelCase,
    isInRange,
    convertStringToArray,
    formatDate,
    getConfigFromFile,
    noop: () => {}
};
