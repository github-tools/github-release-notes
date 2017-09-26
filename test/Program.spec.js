import { assert } from 'chai';
import Program from '../lib/src/Program.js';
import testCommand from 'commander';

describe('Program', () => {
    const testCommand = new Program({
        name: 'Test',
        description: 'This is a test',
        options: [],
        argv: [],
        cwd: process.cwd()
    });

    it('Should have a program and an option properties', () => {
        assert.isOk(testCommand.program, 'Program exists');
        assert.isOk(testCommand.options, 'Options exists');
    });

    describe('_dashToCamelCase', () => {
        it('Should always return a string', () => {
            assert.isString(testCommand._dashToCamelCase('Testing'), 'Passing a string');
            assert.isString(testCommand._dashToCamelCase(false), 'Passing false');
            assert.isString(testCommand._dashToCamelCase(true), 'Passing true');
            assert.isString(testCommand._dashToCamelCase({}), 'Passing Object');
            assert.isString(testCommand._dashToCamelCase(), 'Passing no parameters');
        });

        it('Should return a camelCase string', () => {
            assert.deepEqual(testCommand._dashToCamelCase('i-am-test'), 'iAmTest', 'Pass a dasharised string');
            assert.deepEqual(testCommand._dashToCamelCase('i-amTest'), 'iAmTest', 'Pass a partally dasharised string');
        })
    });

    describe('_camelCaseObjectKeys', () => {
        it('Should always return an Object', () => {
            assert.isObject(testCommand._camelCaseObjectKeys('Testing'), 'Passing a string');
            assert.isObject(testCommand._camelCaseObjectKeys(false), 'Passing false');
            assert.isObject(testCommand._camelCaseObjectKeys(true), 'Passing true');
            assert.isObject(testCommand._camelCaseObjectKeys({}), 'Passing Object');
            assert.isObject(testCommand._camelCaseObjectKeys([]), 'Passing Object');
            assert.isObject(testCommand._camelCaseObjectKeys(), 'Passing no parameters');
        });

        it('Should convert in camelCase all the keys of an Object', () => {
            assert.hasAllKeys(testCommand._camelCaseObjectKeys({
                'a-normal-string': 1,
                'another-string': 2,
                'someThing-else': 3
            }), ['aNormalString', 'anotherString', 'someThingElse'], 'Passing an Object with mixed values');
        });
    });

    describe('_getOptionsFromObject', () => {
        it('Should return an Object', () => {
            assert.isObject(testCommand._getOptionsFromObject('Testing'), 'Passing a string');
            assert.isObject(testCommand._getOptionsFromObject(false), 'Passing false');
            assert.isObject(testCommand._getOptionsFromObject(true), 'Passing true');
            assert.isObject(testCommand._getOptionsFromObject({}), 'Passing Object');
            assert.isObject(testCommand._getOptionsFromObject([]), 'Passing Object');
            assert.isObject(testCommand._getOptionsFromObject(), 'Passing no parameters');
        });

        it('Should only take the options from defaults', () => {
            assert.deepEqual(testCommand._getOptionsFromObject({
                a: 1,
                b: 2,
                c: 3,
                d: 4
            }, {
                a: 'a',
                c: 'c'
            }), {a: 1, c: 3}, 'Passing Object which contains few keys');

            assert.deepEqual(testCommand._getOptionsFromObject({
                a: 1,
                b: 2,
                c: 3,
                d: 4
            }, {
                e: 'e',
                f: 'f'
            }), {}, 'None of the keys exist');

            assert.deepEqual(testCommand._getOptionsFromObject({
                a: 1,
                b: 2
            }, {
                a: 'a',
                b: 'b',
                c: 'c'
            }), {a: 1, b: 2}, 'Object contains more keys than object value');
        });
    });

    describe('_consumeOptions', () => {
        let options;

        before(() => {
            options = [
                {
                    short: '-t',
                    name: 'test',
                    description: 'Testing'
                },
                {
                    short: '-T',
                    name: 'another-test',
                    valueType: '<string>',
                    description: 'Testing [test]',
                    defaultValue: 'test'
                },
                {
                    name: 'third-test',
                    valueType: '<1>,<2>',
                    description: 'Testing',
                    action: v => v.split(',')
                }
            ];
        });

        it('Should return an Object', () => {
            assert.isObject(testCommand._consumeOptions(options), 'Passing the options');
            assert.hasAllKeys(testCommand._consumeOptions(options), ['programOptions', 'defaults'], 'Passing the options');
            assert.isObject(testCommand._consumeOptions(), 'Passing no parameters');
            assert.isObject(testCommand._consumeOptions(false), 'Passing false');
            assert.isObject(testCommand._consumeOptions('string'), 'Passing a string');
            assert.isObject(testCommand._consumeOptions(true), 'Passing true');
        });
    });

    describe('_filterObject', () => {
        it('Should return an object without undefined values', () => {
            assert.deepEqual(testCommand._filterObject({ a: 1, b: undefined, c: false }), { a: 1, c: false }, 'Pass with values number, undefined and false');
        });
    });
});
