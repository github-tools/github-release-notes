#!/usr/bin/env node

import gren from 'commander';
import chalk from 'chalk';
import examples from './_examples';

let command;
const commandList = Object.keys(examples).filter(example => example !== 'default' && example !== 'generateExamples');

gren
    .name('gren examples')
    .description(`See few examples for how to use gren. For more informations (and a bit of UI) check ${chalk.blue('https://github-tools.github.io/github-release-notes/examples.html')}`)
    .usage('<command>')
    .action(cmd => {
        command = cmd;
    })
    .parse(process.argv);

if (!command || !commandList.includes(command)) {
    console.error(`${chalk.red('You must specify one of these commands to output examples')} [${commandList.join('|')}]`);

    process.exit(1);
}

examples.generateExamples(command, examples[command]);
