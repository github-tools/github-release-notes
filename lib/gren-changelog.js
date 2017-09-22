#!/usr/bin/env node

import Program from '../dist/Program';
import Gren from '../dist/Gren';
import { releaseOptions, changelogOptions } from './_options';
import { green } from 'chalk';

const changelogCommand = new Program({
    name: `${green('gren')} changelog`,
    description: 'Create a CHANGELOG.md file, based on release notes',
    argv: process.argv,
    cwd: process.cwd(),
    options: changelogOptions.concat(releaseOptions),
    events: {
        '--help': () => {
            console.log('');
            console.log('  Basic Examples:');
            console.log('');
            console.log('    $ gren changelog');
            console.log('');
            console.log('    $ gren changelog --generate');
            console.log('');
        }
    }
});

changelogCommand.init()
    .then(options => {
        const changelogAction = new Gren(options);

        return changelogAction.changelog();
    })
    .catch(error => {
        console.error(error);
    });
