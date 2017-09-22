#!/usr/bin/env node

import Program from '../dist/Program';
import Gren from '../dist/Gren';
import { releaseOptions } from './_options';
import { green } from 'chalk';

const releaseCommand = new Program({
    name: `${green('gren')} release`,
    description: 'Generate release notes and attach them to a tag',
    argv: process.argv,
    cwd: process.cwd(),
    options: releaseOptions,
    events: {
        '--help': () => {
            console.log('');
            console.log('  Basic Examples:');
            console.log('');
            console.log('    $ gren release');
            console.log('');
            console.log('    $ gren release --tags 2.1.3..4.0.0');
            console.log('');
        }
    }
});

releaseCommand.init()
    .then(options => {
        const releaseAction = new Gren(options);

        return releaseAction.release();
    })
    .catch(error => {
        console.error(error);
    });

