const YAML = require('yamljs');
const chalk = require('chalk');
const { writeFileSync } = require('fs');
const { gren, release, changelog } = require('../lib/_examples');

const files = {
    'gren-examples': YAML.stringify(gren),
    'release-examples': YAML.stringify(release),
    'changelog-examples': YAML.stringify(changelog)
};

Object.entries(files).forEach(([filename, content]) => {
    writeFileSync(`${process.cwd()}/docs/_data/${filename}.yml`, content);

    console.log(chalk.green(`docs/_data/${filename}.yml created.`));
});
