import GitHubInfo from './GitHubInfo';
import program from 'commander';
import { getConfigFromFile } from './_utils.js';

/** Class creating a Commander program, managing the options passed via bash and config file. */
class Program {
    constructor(props) {
        const { programOptions, defaults } = this._consumeOptions(props.options);

        this.name = props.name;
        this.description = props.description;
        this.examples = props.examples;
        this.defaults = defaults;
        this.program = this._programWithEvents(this._programWithOptions(program, programOptions), props.events)
            .name(this.name)
            .description(this.description)
            .parse(props.argv);

        this.options = Object.assign(
            {},
            getConfigFromFile(props.cwd, program.config),
            this._getOptionsFromObject(this.program, this.defaults)
        );
    }

    /**
     * Initialise the module
     *
     * @since 0.10.0
     * @public
     *
     * @return {Promise}
     */
    async init() {
        const options = await this._getEnvOptions();
        this.options = this._filterObject(this._camelCaseObjectKeys(
            Object.assign(
                {},
                this.defaults,
                Object.assign({}, ...[].concat(options)),
                this.options
            )
        ));

        return this.options;
    }

    /**
     * Get informations from the local folder
     *
     * @since 0.10.0
     * @private
     *
     * @return {Promise}
     */
    _getEnvOptions() {
        const githubInfo = new GitHubInfo();
        const { username, repo } = this.options;

        if (username && repo) {
            return githubInfo.token;
        }

        return githubInfo.options;
    }

    /**
     * Remove all the properties that have undefined values from an object
     *
     * @since  0.10.0
     * @private
     *
     * @param  {Object} object
     *
     * @return {Object}
     */
    _filterObject(object) {
        return Object.entries(object)
            .filter(([key, value]) => value !== undefined)
            .reduce((carry, [key, value]) => {
                carry[key] = value;
                return carry;
            }, {});
    }

    /**
     * Add all the given events to a program
     *
     * @since  0.10.0
     * @private
     *
     * @param  {Commander} program
     * @param  {Object} events
     *
     * @return {Commander}
     */
    _programWithEvents(program, events) {
        if (!events || !events.length) {
            return program;
        }

        Object.entries(events).forEach(([event, action]) => {
            program.on(event, action);
        });

        return program;
    }

    /**
     * Add all the given options to a program
     *
     * @since 0.10.0
     * @private
     *
     * @param  {Commander} program
     * @param  {Array} options
     *
     * @return {Commander}
     */
    _programWithOptions(program, options) {
        options.forEach(({ name, description, action, defaultValue }) => program.option(...[name, description, action, defaultValue].filter(Boolean)));
        return program;
    }

    /**
     * Consume the options from the properties and provide get the defaults and the programOptions
     *
     * @since  0.10.0
     * @private
     *
     * @param  {Array} opts
     *
     * @return {Object}
     */
    _consumeOptions(opts = []) {
        if (!Array.isArray(opts)) {
            return {
                programOptions: [],
                defaults: {}
            };
        }

        const programOptions = opts.map(({ short, name, valueType, description, defaultValue, action }) => ({
            name: short && name ? `${short}, --${name} ${valueType || ''}` : ' ',
            description,
            defaultValue,
            action
        }));

        const defaults = this._camelCaseObjectKeys(
            opts.reduce((carry, opt) => {
                carry[opt.name] = opt.defaultValue;
                return carry;
            }, {})
        );

        return {
            programOptions,
            defaults
        };
    }

    /**
     * Extrapulate the options from a program
     *
     * @since  0.10.0
     * @private
     *
     * @param  {Object} defaults
     *
     * @return {Object}
     */
    _getOptionsFromObject(object = {}, defaults = {}) {
        if (typeof object !== 'object' || Array.isArray(object)) {
            return {};
        }

        return Object.keys(defaults).reduce((carry, option) => {
            if (object[option] && object[option] !== defaults[option]) {
                carry[option] = object[option];
            }

            return carry;
        }, {});
    }

    /**
     * Converts all Object values to camel case
     *
     * @param  {Object} object
     *
     * @return {Object}
     */
    _camelCaseObjectKeys(object = {}) {
        if (typeof object !== 'object' || Array.isArray(object)) {
            return {};
        }

        return Object.entries(object).reduce((carry, [key, value]) => {
            carry[this._dashToCamelCase(key)] = value;
            return carry;
        }, {});
    }

    /**
    * Transforms a dasherize string into a camel case one.
    *
    * @since 0.3.2
    * @private
    *
    * @param  {string} value The dasherize string
    *
    * @return {string}       The camel case string
    */
    _dashToCamelCase(value = '') {
        if (typeof value !== 'string') {
            return '';
        }

        return value
            .replace(/-([a-z])/g, (match) => match[1].toUpperCase());
    }
}

export default Program;
