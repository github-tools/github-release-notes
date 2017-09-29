const YAML = require('yamljs');
const chalk = require('chalk');
const { writeFileSync } = require('fs');
const { changelogOptions, releaseOptions, globalOptions } = require('../lib/_options');

const stringifyObject = array => YAML.stringify(
    array
        .filter(({ short }) => short)
        .map(option => {
            let filteredObject = Object.assign({}, option);
            delete filteredObject.action;

            return filteredObject;
        })
);
const files = {
    'changelog-options': stringifyObject(changelogOptions),
    'release-options': stringifyObject(releaseOptions),
    'global-options': stringifyObject(globalOptions)
};

Object.entries(files).forEach(([filename, content]) => {
    writeFileSync(`${process.cwd()}/docs/_data/${filename}.yml`, content);

    console.log(chalk.green(`docs/_data/${filename}.yml created.`));
});
