#!/usr/bin/env node

import release from 'commander';
import { programWithOptions, getDefaults, getOptions } from '../dest/utils';

const optionsSet = [
    {
        name: '-u, --username [username]',
        description: 'The username of the repo e.g. github-tools',
        option: 'username'
    },
    {
        name: '-r, --repo [repository]',
        description: 'The repository name e.g. github-release-notes',
        option: 'repo'
    },
    {
        name: '-au, --api-url [url]',
        description: 'Override the GitHub API URL, allows gren to connect to a private GHE installation',
        option: 'api-url'
    },
    {
        name: '-p, --prefix [release prefix]',
        description: 'Add a prefix to the tag version. e.g. \'v\'',
        option: 'prefix'
    }
];

programWithOptions(release, optionsSet)
    .name('gren release')
    .parse(process.argv);

console.log(getOptions(release, getDefaults(optionsSet)));
