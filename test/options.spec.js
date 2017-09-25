import { assert } from 'chai';
import { globalOptions, releaseOptions, changelogOptions } from '../lib/_options';

describe('_options.js', () => {
    it('Should have unique shorts', () => {
        const duplicates = globalOptions.concat(releaseOptions, changelogOptions)
            .map(({ short }) => short)
            .filter(Boolean)
            .filter((short, index, array) => array.indexOf(short) !== index)
            .length;

        assert.isOk(duplicates === 0, 'There are no duplicates');
    });

    it('Should have unique names', () => {
        const duplicates = globalOptions.concat(releaseOptions, changelogOptions)
            .map(({ name }) => name)
            .filter(Boolean)
            .filter((name, index, array) => array.indexOf(name) !== index)
            .length;

        assert.isOk(duplicates === 0, 'There are no duplicates');
    });
});
