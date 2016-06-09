'use strict';

var utils = require('../src/utils');

/*
======== A Handy Little Nodeunit Reference ========
https://github.com/caolan/nodeunit

Test methods:
test.expect(numAssertions)
test.done()
Test assertions:
test.ok(value, [message])
test.equal(actual, expected, [message])
test.notEqual(actual, expected, [message])
test.deepEqual(actual, expected, [message])
test.notDeepEqual(actual, expected, [message])
test.strictEqual(actual, expected, [message])
test.notStrictEqual(actual, expected, [message])
test.throws(block, [error], [message])
test.doesNotThrow(block, [error], [message])
test.ifError(value)
*/

exports['utils'] = {
   setUp: function (done) {
   // setup here
   done();
   },
   'Should return the string of the formatted date': function (test) {
      test.expect(1);

      test.deepEqual(utils.formatDate(new Date(0)), '01/01/1970', 'Given a date object.');
      test.done();
   },
   'Should return the options in a key/value format': function (test) {
      test.expect(1);

      let bashOptions = utils.getBashOptions([null, null, '--key=value', '--key2=value2']);

      test.deepEqual(JSON.stringify(bashOptions), JSON.stringify({
         key: 'value',
         key2: 'value2'
      }), 'Given an array of node arguments.');
      test.done();
   },
   'Should return a camelCase string': function (test) {
      test.expect(2);

      test.deepEqual(utils.dashToCamelCase('this-is-a-string'), 'thisIsAString', 'Given a string with dashes.');
      test.deepEqual(utils.dashToCamelCase('tHIs-Is-a-sTriNg'), 'thisIsAString', 'Given a string with random capital letters');
      test.done();
   },
   'Should return if a number is in between a range': function (test) {
      test.expect(7);

      test.deepEqual(utils.isInRange(2, 1, 3), true, 'Given a number in range');
      test.deepEqual(utils.isInRange(1, 2, 3), false, 'Given a number below range');
      test.deepEqual(utils.isInRange(4, 1, 3), false, 'Given a number above range');
      test.deepEqual(utils.isInRange(-1, 1, 3), false, 'Given a number above range, negative');
      test.deepEqual(utils.isInRange(-1, -3, 0), true, 'Given a number in range, negative');
      test.deepEqual(utils.isInRange(2, 2, 5), true, 'Given same number as first range value');
      test.deepEqual(utils.isInRange(5, 2, 5), false, 'Given same number as last range value');

      test.done();
   }
};