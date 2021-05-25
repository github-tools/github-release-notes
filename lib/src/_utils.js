const chalk = require('chalk');
const fs = require('fs');
const ora = require('ora');
const YAML = require('json2yaml');
const Path = require('path');
const { js_beautify: beautify } = require('js-beautify');
const requireFromUrl = require('require-from-url/sync');
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
function printTask(isQuiet, name) {
    if (isQuiet) {
        return;
    }

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
    if (gren.options.quiet) {
        gren.tasks[taskName] = {};

        return noop;
    }
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
    return ('0' + date.getUTCDate()).slice(-2) + '/' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '/' + date.getUTCFullYear();
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

    process.stdout.write(chalk.cyan(`Getting gren config from local file ${filepath}\n`));

    if (getFileNameFromPath(filepath).match(/\./g).length === 1) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }

    return require(filepath);
}

/**
 * Get configuration from the one of the config files
 *
 * @since 0.6.0
 * @private
 *
 * @param  {string} path Path where to look for config files
 * @return {Object} The configuration from the first found file or empty object
 */
function getConfigFromFile(path, customFilename = null) {
    if (customFilename) {
        const config = requireConfig(Path.join(path, customFilename));
        if (!config) {
            throw chalk.red(`Could not find custom config file: ${customFilename}`);
        }
        return config;
    }

    return getFileTypes()
        .reduce((carry, filename) => carry || requireConfig(Path.join(path, filename)), false) || {};
}

/**
 * Return the extension of a filename
 *
 * @param  {string} filename
 *
 * @return {string}
 */
function getFileExtension(filename) {
    return filename.slice((Math.max(0, filename.lastIndexOf('.')) || Infinity) + 1);
}

/**
 * Create the content for a configuratio file, based on extension and data
 *
 * @param  {string} path
 * @param  {Object} data
 *
 * @return {string} File content
 */// istanbul ignore next
function writeConfigToFile(path, data) {
    const extension = getFileExtension(getFileNameFromPath(path));
    const dataType = {
        yml: content => YAML.stringify(content),
        yaml: content => YAML.stringify(content),
        json: content => beautify(JSON.stringify(content)),
        none: content => beautify(JSON.stringify(content)),
        js: content => beautify(`module.exports = ${JSON.stringify(content)}`)
    };

    return dataType[extension || 'none'](data);
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
function getFileNameFromPath(path = '') {
    return path.replace(/^.*[\\/]/, '');
}

/**
 * Get the file types for the configuration
 *
 * @since  0.13.0
 *
 * @return {Array}
 */
function getFileTypes() {
    return [
        '.grenrc.yml',
        '.grenrc.json',
        '.grenrc.yaml',
        '.grenrc.js',
        '.grenrc'
    ];
}

/**
 * Remove all the configuration files
 *
 * @since  0.13.0
 *
 * @param {Boolean} confirm     Necessary to force the function.
 */
function cleanConfig(confirm, path = process.cwd()) {
    if (confirm !== true) {
        return;
    }

    getFileTypes().forEach(fileName => {
        const file = `${path}/${fileName}`;
        if (!fs.existsSync(file)) {
            return false;
        }

        fs.unlinkSync(file);

        return file;
    });
}

/**
 * judge whether to get config from remote uri
 * @since  0.18.0
 * @private
 *
 * @param {string} path
 *
 * @returns {string}
 */
function getRemoteUrl(path) {
    const pkgPath = Path.join(path, 'package.json');
    const pkgExist = fs.existsSync(pkgPath);
    const { gren = '' } = pkgExist ? require(pkgPath) : {};
    return gren;
}

/**
 * get config from remote
 * @since 0.18.0
 * @private
 *
 * @param  {string} path Path where to look for config files
 * @return {Object} The configuration from the first found file or empty object
*/
function getConfigFromRemote(url) {
    if (!url) return null;

    process.stdout.write(chalk.cyan(`Fetching gren config from remote: ${url}\n`));

    let config = null;
    try {
        config = requireFromUrl(url);
    } catch (error) {
        // console.error(error);
        process.stdout.write(chalk.cyan(`Fetched remote config fail: ${url}\n`));
        throw new Error(error);
    }

    process.stdout.write(chalk.cyan(`Fetched remote config succeed`));

    return config;
}

/**
 * combine getConfigFromRemote & getGrenConfig
 * @since 0.18.0
 * @public
 *
 * @param  {string} path Path where to look for config files
 * @return {Object} The configuration from the first found file or empty object
*/
function getGrenConfig(path, ...args) {
    const remoteUrl = getRemoteUrl(path);
    let config;
    if (remoteUrl) {
        config = getConfigFromRemote(remoteUrl);
    }

    if (!config) {
        config = getConfigFromFile(path, ...args);
    }

    return config;
}

/**
 * Just a noop function
 */
function noop() {}

// Allow nodeunit to work. Has to be fixed.
module.exports = {
    cleanConfig,
    clearTasks,
    convertStringToArray,
    dashToCamelCase,
    formatDate,
    getConfigFromFile,
    getRemoteUrl,
    getConfigFromRemote,
    getGrenConfig,
    getFileExtension,
    getFileNameFromPath,
    getFileTypes,
    isInRange,
    noop,
    printTask,
    requireConfig,
    sortObject,
    task,
    writeConfigToFile
};
