import { assert } from 'chai';
import * as utils from '../lib/src/_utils';

describe('_utils.js', () => {
    it('Should return the string of the formatted date', () => {
        assert.deepEqual(utils.formatDate(new Date(0)), '01/01/1970', 'Given a date object.');
    });

    it('Should return a camelCase string', () => {
        assert.deepEqual(utils.dashToCamelCase('this-is-a-string'), 'thisIsAString', 'Given a string with dashes.');
        assert.deepEqual(utils.dashToCamelCase('tHIs-Is-a-sTriNg'), 'thisIsAString', 'Given a string with random capital letters');
    });

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
