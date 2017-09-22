import ObjectAssign from 'object-assign-deep';
import fs from 'fs';
import program from 'commander';

export default class Program {
    constructor(props) {
        const { programOptions, defaults } = this._consumeOptions(props.options);

        this.name = props.name;
        this.description = props.description;

        this.program = this._programWithEvents(this._programWithOptions(program, programOptions), props.events)
            .name(this.name)
            .description(this.description)
            .parse(props.argv);

        this.options = this._filterObject(this._camelCaseObjectKeys(
            ObjectAssign(
                {},
                defaults,
                props.bashOptions,
                this._getConfigFromFile(props.cwd),
                this._getOptionsFromProgram(defaults)
            )
        ));
    }

    /**
     * Remove all the properties that have undefined values from an object
     *
     * @param  {Object} object [description]
     * @return {[type]}         [description]
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
     * Get configuration from the one of the config files
     *
     * @since 0.6.0
     * @public
     *
     * @param  {string} path Path where to look for config files
     * @return {Object} The configuration from the first found file or empty object
     */
    _getConfigFromFile(path) {
        const _requireConfig = filepath => {
            if (!fs.existsSync(filepath)) {
                return false;
            }

            if (filepath.match(/\./g).length === 1) {
                return JSON.parse(fs.readFileSync(filepath, 'utf8'));
            }

            return require(filepath);
        };

        return [
            '.grenrc.yml',
            '.grenrc.json',
            '.grenrc.yaml',
            '.grenrc.js',
            '.grenrc'
        ].reduce((carry, filename) => carry || _requireConfig(path + '/' + filename), false) || {};
    }

    /**
     * Add all the given events to a program
     *
     * @since  0.10.0
     *
     * @param  {Commander} program
     * @param  {Object} events
     *
     * @return {Commander}
     */
    _programWithEvents(program, events) {
        Object.entries(events).forEach(([event, action]) => {
            program.on(event, action);
        });

        return program;
    }

    /**
     * Add all the given options to a program
     *
     * @since 0.10.0
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
     *
     * @param  {Object} opts
     *
     * @return {Object}
     */
    _consumeOptions(opts) {
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
     *
     * @param  {Object} defaults
     *
     * @return {Object} ALEX
     */
    _getOptionsFromProgram(defaults) {
        return Object.keys(defaults).reduce((carry, option) => {
            if (this.program[option]) {
                carry[option] = this.program[option];
            }

            return carry;
        }, {});
    }

    /**
     * Converts all Object values to camel case
     *
     * @param  {[type]} object [description]
     * @return {[type]}        [description]
     */
    _camelCaseObjectKeys(object) {
        return Object.entries(object).reduce((carry, [key, value]) => {
            carry[this._dashToCamelCase(key)] = value;
            return carry;
        }, {});
    }

    /**
    * Transforms a dasherize string into a camel case one.
    *
    * @since 0.3.2
    *
    * @param  {string} value The dasherize string
    *
    * @return {string}       The camel case string
    */
    _dashToCamelCase(value) {
        return value
            .replace(/-([a-z])/g, (match) => match[1].toUpperCase());
    }
}
