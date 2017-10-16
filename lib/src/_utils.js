const chalk = require('chalk');
const fs = require('fs');
const ora = require('ora');
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
*/// istanbul ignore next
function printTask(name) {
    process.stdout.write(chalk.blue(`\n🤖  - ${name}:\n===================================\n`));
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
*/// istanbul ignore next
function task(gren, taskName) {
    const spinner = ora(taskName);
    gren.tasks[taskName] = spinner;

    spinner.start();

    return message => {
        spinner.succeed(message);
    };
}

/**
 * Clears all the tasks that are still running
 *
 * @since 0.6.0
 * @public
 *
 * @param  {GithubReleaseNotes} gren
 */// istanbul ignore next
function clearTasks(gren) {
    if (!Object.keys(gren.tasks.length)) {
        return;
    }

    Object.keys(gren.tasks).forEach((taskName) => {
        gren.tasks[taskName].stop();
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

    if (getFileNameFromPath(filepath).match(/\./g).length === 1) {
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

/**
 * Get the filename from a path
 *
 * @since  0.10.0
 * @private
 *
 * @param  {string} path
 *
 * @return {string}
 */
function getFileNameFromPath(path) {
    return path.split('\\').pop().split('/').pop();
}

// Allow nodeunit to work. Has to be fixed.
module.exports = {
    sortObject,
    printTask,
    task,
    clearTasks,
    dashToCamelCase,
    isInRange,
    convertStringToArray,
    formatDate,
    requireConfig,
    getConfigFromFile,
    noop: () => {}
};
