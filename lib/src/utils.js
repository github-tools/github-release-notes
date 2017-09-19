import fs from 'fs';
import ObjectAssign from 'object-assign-deep';

/**
 * Add all the given options to a program
 *
 * @since 0.9.0
 *
 * @param  {Object} program
 * @param  {Array} options
 *
 * @return {Object}
 */
const programWithOptions = (program, options) => {
    options.forEach(({ name, description, defaultValue }) => program.option(name, description, defaultValue));
    return program;
};

/**
 * Swap capital -V for -v in the array (used for the options)
 *
 * @since 0.9.0
 *
 * @param  {Array} argvs
 *
 * @return {Array}
 */
const argvWithVersion = argvs => {
    const vPos = argvs.indexOf('-v');

    if (vPos > -1) {
        argvs[vPos] = '-V';
    }

    return argvs;
};

/**
 * Gets the content from a filepath a returns an object
 *
 * @since  0.6.0
 * @public
 *
 * @param  {string} filepath
 * @return {Object|boolean}
 */
const requireConfig = filepath => {
    if (!fs.existsSync(filepath)) {
        return false;
    }

    if (filepath.match(/\./g).length === 1) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }

    return require(filepath);
};

/**
 * Get configuration from the one of the config files
 *
 * @since 0.6.0
 * @public
 *
 * @param  {string} path Path where to look for config files
 * @return {Object} The configuration from the first found file or empty object
 */
const getConfigFromFile = path => [
    '.grenrc.yml',
    '.grenrc.json',
    '.grenrc.yaml',
    '.grenrc.js',
    '.grenrc'
]
    .reduce((carry, filename) => carry || requireConfig(path + '/' + filename), false) || {};

/**
 * Get defaults options from the optionSet
 *
 * @param  {Array} options
 *
 * @return {Object}
 */
const getDefaults = options => options.reduce((carry, { option, defaultValue }) => {
    carry[option] = defaultValue;
    return carry;
}, {});

/**
 * Get the options from the program, the defaults and other objects
 *
 * @param  {Commander} program
 * @param  {Object} defaults
 *
 * @return {Object}
 */
const getOptions = (program, defaults) => {
    const programOptions = Object.keys(defaults).reduce((carry, option) => {
        if (program[option]) {
            carry[option] = program[option];
        }

        return carry;
    }, {});

    return ObjectAssign({}, defaults, getConfigFromFile(process.cwd()), programOptions);
};

export {
    programWithOptions,
    argvWithVersion,
    getConfigFromFile,
    getDefaults,
    getOptions
};
