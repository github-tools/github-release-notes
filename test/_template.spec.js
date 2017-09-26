import { assert } from 'chai';
import { generate } from '../lib/src/_template';

describe('_template.js', () => {
    describe('generate', () => {
        it('Should return a string', () => {
            const placeholders = {
                greeting: 'ciao',
                name: 'Alex'
            };
            const string = '{{greeting}}, {{name}}';
            const functionString = ({ greeting, name }) => `${greeting} .. ${name.toLowerCase()}`;

            assert.isString(generate(placeholders, string), 'Passing a string');
            assert.deepEqual(generate(placeholders, string), 'ciao, Alex', 'Passing a string');
            assert.deepEqual(generate(placeholders, functionString), 'ciao .. alex', 'Passing a function');
        });
    });
});
