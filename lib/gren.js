#!/usr/bin/env node

import gren from 'commander';
import { version, description } from '../package.json';

const argvWithVersion = argvs => {
    const vPos = argvs.indexOf('-v');

    if (vPos > -1) {
        argvs[vPos] = '-V';
    }

    return argvs;
};

gren
    .version(version)
    .description(`gren (🤖 ) ${description}`)
    .usage('<command> [options]')
    .command('init', 'initialise the module')
    .command('release', 'Release into chunk').alias('r')
    .command('changelog', 'Write a motherfucking changelog').alias('c')
    .command('examples', 'Show few examples of stuff that you can do <cmd>')
    .parse(argvWithVersion(process.argv));
