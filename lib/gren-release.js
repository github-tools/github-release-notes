#!/usr/bin/env node

import Program from '../dist/Program';
import GitHubInfo from '../dist/GitHubInfo';
import Release from '../dist/Release';
import { options } from './_release-options';

const githubInfo = new GitHubInfo();

githubInfo.options.then(githubOptions => Promise.resolve(new Program({
    name: 'gren release',
    description: 'Generate release notes and attach them to a tag',
    argv: process.argv,
    cwd: process.cwd(),
    bashOptions: Object.assign({}, ...githubOptions),
    options,
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
})))
    .then(({ options }) => {
        const releaseAction = new Release(options);
        return releaseAction.release();
    })
    .catch(error => {
        console.error(error);
    });
