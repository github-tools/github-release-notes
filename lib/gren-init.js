#!/usr/bin/env node

import gren from 'commander';
import { green } from 'chalk';
import ObjectAssignDeep from 'object-assign-deep';
import init from '../dist/_init';
import utils from '../dist/_utils';
import fs from 'fs';

gren
    .name(`${green('gren')} release`)
    .description('Initialise the module options.')
    .parse(process.argv);

init()
    .then(({
        fileExist,
        apiUrlType,
        ignoreCommitsWithConfirm,
        ignoreLabelsConfirm,
        ignoreIssuesWithConfirm,
        ignoreTagsWithConfirm,
        fileType,
        ...data
    }) => {
        if (fileExist === 'abort') {
            console.log('Command aborted.');
            return;
        }

        if (fileExist === 'override') {
            const fileContent = utils.writeConfigToFile(fileType, data);

            utils.cleanConfig(true);
            fs.writeFileSync(fileType, fileContent);

            console.log(green(`\nGreat news! Your ${fileType} as been created!`));
            return;
        }

        const currentConfig = utils.getGrenConfig(process.cwd());
        const fileContent = utils.writeConfigToFile(fileType, ObjectAssignDeep({}, currentConfig, data));

        fs.writeFileSync(fileType, fileContent);

        console.log(green(`\nGreat news! Your ${fileType} as been created!`));
    })
    .catch(error => {
        console.log(error);
        process.exit(1);
    });
