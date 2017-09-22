#!/usr/bin/env node

import Program from '../dist/Program';
import GitHubInfo from '../dist/GitHubInfo';
import Gren from '../dist/Gren';
import { releaseOptions, changelogOptions } from './_options';
import { green } from 'chalk';

const githubInfo = new GitHubInfo();

githubInfo.options.then(githubOptions => Promise.resolve(new Program({
    name: `${green('gren')} changelog`,
    description: 'Create a CHANGELOG.md file, based on release notes',
    argv: process.argv,
    cwd: process.cwd(),
    bashOptions: Object.assign({}, ...githubOptions),
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
})))
    .then(({ options }) => {
        const changelogAction = new Gren(options);

        return changelogAction.changelog();
    })
    .catch(error => {
        console.error(error);
    });
