#!/usr/bin/env node

import Program from '../dist/Program';
import Gren from '../dist/Gren';
import { globalOptions, releaseOptions } from './_options';
import { green } from 'chalk';

const releaseCommand = new Program({
    name: `${green('gren')} release`,
    description: 'Generate release notes and attach them to a tag',
    argv: process.argv,
    cwd: process.cwd(),
    options: releaseOptions.concat(globalOptions)
});

releaseCommand.init()
    .then(options => {
        const releaseAction = new Gren(options);

        return releaseAction.release();
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

