const { releaseOptions, changelogOptions } = require('../lib/_options');

exports['options'] = {
    'There should be no duplicates': function (test) {
        test.expect(1);

        const duplicates = releaseOptions.concat(changelogOptions)
            .map(option => option.short)
            .filter((short, index, array) => array.indexOf(short) !== index)
            .length;

        test.ok(duplicates === 0, 'There are no duplicates');
        test.done();
    }
};
