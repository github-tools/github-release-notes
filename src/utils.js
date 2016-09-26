'use strict';

let chalk = require('chalk');

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
function task(taskName) {
    let time = process.hrtime();
    process.stdout.write(chalk.green(taskName) + ': .');

    let si = setInterval(function() {
        process.stdout.write('.');
    }, 100);

    return function(message) {
        let diff = process.hrtime(time);

        process.stdout.write(message || '' + chalk.yellow(' (' + ((diff[0] * 1e9 + diff[1]) * 1e-9).toFixed(2) + ' secs)\n'));
        clearInterval(si);
    };
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
      .replace(/-([a-z])/g, function(match) {
          return match[1].toUpperCase();
      });
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
    let settings = {};

    for (let i = 2; i < args.length; i++) {
        let paramArray = args[i].split('=');
        let key = paramArray[0].replace('--', '');
        let value = paramArray[1];

        settings[dashToCamelCase(key)] = value || true;
    }

    return settings;
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

module.exports = {
    printTask: printTask,
    task: task,
    getBashOptions: getBashOptions,
    dashToCamelCase: dashToCamelCase,
    isInRange: isInRange,
    formatDate: formatDate
};
