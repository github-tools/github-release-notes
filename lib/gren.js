#!/usr/bin/env node

import gren from 'commander';
import { version, description } from '../package.json';
import { argvWithVersion } from '../dest/utils';

gren
    .version(version)
    .description(description)
    .usage('[command] [options]')
    .command('release', 'Release into chunk').alias('r')
    .command('changelog', 'Write a motherfucking changelog').alias('c')
    .on('--help', () => {
        console.log('');
        console.log('  Examples:');
        console.log('');
        console.log('    $ gren release');
        console.log('');
        console.log('    $ gren help release');
        console.log('');
    })
    .parse(argvWithVersion(process.argv));
