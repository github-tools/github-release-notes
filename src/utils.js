'use strict';

var chalk = require('chalk');

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
    var time = process.hrtime();
    process.stdout.write(chalk.green(taskName) + ': .');

    gren.tasks[taskName] = setInterval(function() {
        process.stdout.write('.');
    }, 100);

    return function(message) {
        var diff = process.hrtime(time);
        var seconds = ((diff[0] * 1e9 + diff[1]) * 1e-9).toFixed(2);

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
    if (!gren.tasks.length) {
        return;
    }

    Object.keys(gren.tasks).forEach(function(taskName) {
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
    var settings = {};

    for (var i = 2; i < args.length; i++) {
        var paramArray = args[i].split('=');
        var key = paramArray[0].replace('--', '');
        var value = paramArray[1];

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
    clearTasks: clearTasks,
    getBashOptions: getBashOptions,
    dashToCamelCase: dashToCamelCase,
    isInRange: isInRange,
    formatDate: formatDate
};
