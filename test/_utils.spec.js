import { assert } from 'chai';
import chalk from 'chalk';
import fs from 'fs';
import YAML from 'yamljs';
import * as utils from '../lib/src/_utils';

describe('_utils.js', () => {
    describe('sortObject', () => {
        it('Should return a sorted Object', () => {
            const unSortedObject = {
                b: 2,
                a: 1,
                d: 4,
                c: 3
            };
            const sortedObject = {
                a: 1,
                b: 2,
                c: 3,
                d: 4
            };
            assert.deepEqual(utils.sortObject(unSortedObject), sortedObject, 'Passing an Object');
        });
    });

    describe('convertStringToArray', () => {
        it('Should return an empty Array', () => {
            assert.deepEqual(utils.convertStringToArray(false), [], 'Passing false');
            assert.deepEqual(utils.convertStringToArray(undefined), [], 'Passing false');
            assert.deepEqual(utils.convertStringToArray([]), [], 'Passing empty Array');
        });

        it('Should return the same Array/Object', () => {
            const flatArray = [1, 2, 3];
            const flatWordsArray = ['one', 'two', 'three'];
            assert.deepEqual(utils.convertStringToArray(flatArray), flatArray, 'Given a flat Array');
            assert.deepEqual(utils.convertStringToArray(flatWordsArray), flatWordsArray, 'Given a flat Array');

            const deepArray = [[1, 2, 3], [4, 5, 6], 3];
            assert.deepEqual(utils.convertStringToArray(deepArray), deepArray, 'Given a deep Array');

            const flatObject = {
                a: 1,
                b: 2,
                c: 3
            };
            assert.deepEqual(utils.convertStringToArray(flatObject), Object.values(flatObject), 'Given a flat Object');

            const deepObject = {
                a: [1, 2, 3],
                b: [4, 5, 6],
                c: 3
            };
            assert.deepEqual(utils.convertStringToArray(deepObject), Object.values(deepObject), 'Given a deep Object');

            assert.deepEqual(utils.convertStringToArray('1, 2, 3'), ['1', '2', '3'], 'Given a string with spaces');
            assert.deepEqual(utils.convertStringToArray('1,2,3'), ['1', '2', '3'], 'Given a string without spaces');
        });

        it('Should replace the underscores with spaces', () => {
            assert.deepEqual(utils.convertStringToArray('one_1, two_2, three_3'), ['one 1', 'two 2', 'three 3']);
        });
    });

    describe('formatDate', () => {
        it('Should return the string of the formatted date', () => {
            assert.deepEqual(utils.formatDate(new Date(0)), '01/01/1970', 'Given a date object.');
        });
    });

    describe('dashToCamelCase', () => {
        it('Should return a camelCase string', () => {
            assert.deepEqual(utils.dashToCamelCase('this-is-a-string'), 'thisIsAString', 'Given a string with dashes.');
            assert.deepEqual(utils.dashToCamelCase('tHIs-Is-a-sTriNg'), 'thisIsAString', 'Given a string with random capital letters');
        });
    });

    describe('isInRange', () => {
        it('Should return if a number is in between a range', () => {
            assert.deepEqual(utils.isInRange(2, 1, 3), true, 'Given a number in range');
            assert.deepEqual(utils.isInRange(1, 2, 3), false, 'Given a number below range');
            assert.deepEqual(utils.isInRange(4, 1, 3), false, 'Given a number above range');
            assert.deepEqual(utils.isInRange(-1, 1, 3), false, 'Given a number above range, negative');
            assert.deepEqual(utils.isInRange(-1, -3, 0), true, 'Given a number in range, negative');
            assert.deepEqual(utils.isInRange(2, 2, 5), true, 'Given same number as first range value');
            assert.deepEqual(utils.isInRange(5, 2, 5), false, 'Given same number as last range value');
        });
    });

    describe('requireConfig', () => {
        const files = utils.getFileTypes()
            .map(file => `${process.cwd()}/test/.temp/${file}`);
        const simpleObject = {
            a: 1,
            b: 2
        };
        const ymlFileContent = YAML.stringify(simpleObject);
        const jsonFileContent = JSON.stringify(simpleObject);

        beforeEach(() => {
            files.forEach(file => {
                if (file.match(/\.yml$|yaml$/)) {
                    fs.writeFileSync(file, ymlFileContent);

                    return;
                }

                if (file.match(/\.json$/)) {
                    fs.writeFileSync(file, jsonFileContent);

                    return;
                }

                if (file.match(/\.js$/)) {
                    fs.writeFileSync(file, `module.exports = ${jsonFileContent}`);

                    return;
                }

                fs.writeFileSync(file, jsonFileContent);
            });
        });

        it('Should return false', () => {
            assert.isNotOk(utils.requireConfig('this/does/not/.exist.json'), 'Invalid path');
        });

        it('Should return the Object from any of the supported files', () => {
            files.forEach(file => {
                assert.deepEqual(utils.requireConfig(file), simpleObject, `Using ${file}`);
            });
        });

        afterEach(() => {
            files.forEach(file => fs.unlinkSync(file));
        });
    });

    describe('getConfigFromFile', () => {
        const filename = process.cwd() + '/test/.temp/.grenrc';
        const fileContent = {
            a: 1,
            b: 2
        };

        const customFilename = process.cwd() + '/test/.temp/.custom-grenrc';
        const customFileContent = {
            c: 3,
            d: 4
        };

        beforeEach(() => {
            fs.writeFileSync(filename, JSON.stringify(fileContent));
            fs.writeFileSync(customFilename, JSON.stringify(customFileContent));
        });

        it('Should always return an Object', () => {
            assert.isOk(typeof utils.getConfigFromFile(process.cwd() + '/test/.temp') === 'object', 'The type is an object');
            assert.deepEqual(utils.getConfigFromFile(process.cwd() + '/test/.temp'), fileContent, 'Given the right path');
            assert.deepEqual(utils.getConfigFromFile(process.cwd() + '/test/.temp', '.custom-grenrc'), customFileContent, 'Given a custom path');
            assert.deepEqual(utils.getConfigFromFile(process.cwd() + '/test'), {}, 'Given a path with no config file');
        });

        it('Should throw on non-existent custom config file', () => {
            assert.throws(
                () => utils.getConfigFromFile(process.cwd() + '/test/.temp', '.non-existing-grenrc'),
                chalk.red('Could not find custom config file: .non-existing-grenrc')
            );
        });

        afterEach(() => {
            fs.unlinkSync(filename);
            fs.unlinkSync(customFilename);
        });
    });

    describe('getConfigFromRemote', () => {
        const grenRemote = 'https://raw.githubusercontent.com/FEMessage/github-release-notes/master/.grenrc.js';
        const grenrc = require(process.cwd() + '/.grenrc.js');

        it('Should fetch config from remote url', () => {
            assert.deepEqual(utils.getConfigFromRemote(grenRemote), grenrc, 'Given a remote gren config');
        });
    });

    describe('getFileExtension', () => {
        it('Should return the extension of the file', () => {
            assert.deepEqual(utils.getFileExtension('filename.txt'), 'txt', 'Just the filename');
            assert.deepEqual(utils.getFileExtension('filename.something.txt'), 'txt', 'Filename with dots');
            assert.deepEqual(utils.getFileExtension('.filename.txt'), 'txt', 'Filename that starts with dots');
        });
    });

    describe('getFileNameFromPath', () => {
        it('Should return the filename', () => {
            assert.deepEqual(utils.getFileNameFromPath('path/to/filename.txt'), 'filename.txt', 'Simple path');
            assert.deepEqual(utils.getFileNameFromPath('path/to/.filename.txt'), '.filename.txt', 'Simple path and filename with dot');
            assert.deepEqual(utils.getFileNameFromPath('path/to\\ a \\(complex\\)/.filename.txt'), '.filename.txt', 'Complex path and filename with dot');
        });
    });

    describe('getFileTypes', () => {
        it('Should return an Array', () => {
            assert.isArray(utils.getFileTypes(), 'Call the function');
        });
    });

    describe('cleanConfig', () => {
        const path = process.cwd() + '/test/.temp';
        const fileContent = {
            a: 1,
            b: 2
        };

        beforeEach(() => {
            fs.writeFileSync(`${path}/.grenrc`, JSON.stringify(fileContent));
        });

        it('Should not do anything', () => {
            assert.isNotOk(utils.cleanConfig(), 'When no confirm has passed');
            assert.isNotOk(utils.cleanConfig('hey'), 'When confirm has passed, but not true');
        });

        it('Should delete any config file present in path', () => {
            utils.cleanConfig(true, path);
            assert.isNotOk(fs.existsSync(`${path}/.grenrc`));
        });
    });

    describe('noop', () => {
        it('Should be a function that returns undefined', () => {
            assert.deepEqual(utils.noop(), undefined, 'Running the function');
        });
    });
});
