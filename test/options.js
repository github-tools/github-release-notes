const { releaseOptions, changelogOptions, globalOptions } = require('../lib/_options');

exports['options'] = {
    'Should have unique shorts': function (test) {
        test.expect(1);

        const duplicates = globalOptions.concat(releaseOptions, changelogOptions)
            .map(option => option.short)
            .filter(Boolean)
            .filter((short, index, array) => array.indexOf(short) !== index)
            .length;

        test.ok(duplicates === 0, 'There are no duplicates');
        test.done();
    },
    'Should have unique names': function (test) {
        test.expect(1);

        const duplicates = globalOptions.concat(releaseOptions, changelogOptions)
            .map(option => option.name)
            .filter(Boolean)
            .filter((name, index, array) => array.indexOf(name) !== index)
            .length;

        test.ok(duplicates === 0, 'There are no duplicates');
        test.done();
    }
};
