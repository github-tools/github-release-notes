import { assert } from 'chai';
import chalk from 'chalk';
import fs from 'fs';
import Gren from '../lib/src/Gren.js';
import { requireConfig } from '../lib/src/_utils.js';

describe('Gren', () => {
    const gren = new Gren({
        token: process.env.GREN_GITHUB_TOKEN,
        username: 'github-tools',
        repo: 'github-release-notes'
    });

    it('Should generate the options', () => {
        assert.isOk(gren.options, 'The options exist');
    });

    describe('_createReleaseRanges', () => {
        const blocks = [
            {
                date: '2017-09-01T23:00:00.000Z'
            },
            {
                date: '2016-09-01T23:00:00.000Z'
            },
            {
                date: '2017-05-01T23:00:00.000Z'
            },
            {
                date: '2017-10-01T23:00:00.000Z'
            }
        ];

        describe('_sortReleasesByDate', () => {
            it('Should sort an Array by it\'s date property', () => {
                const sortedBlocks = [
                    {
                        date: '2017-10-01T23:00:00.000Z'
                    },
                    {
                        date: '2017-09-01T23:00:00.000Z'
                    },
                    {
                        date: '2017-05-01T23:00:00.000Z'
                    },
                    {
                        date: '2016-09-01T23:00:00.000Z'
                    }
                ];

                assert.deepEqual(gren._sortReleasesByDate(blocks), sortedBlocks, 'Given release blocks');
            });
        });

        it('Should return ranges of Objects', () => {
            const rangedBlocks = [
                [
                    {
                        date: '2017-10-01T23:00:00.000Z'
                    },
                    {
                        date: '2017-09-01T23:00:00.000Z'
                    }
                ],
                [
                    {
                        date: '2017-09-01T23:00:00.000Z'
                    },
                    {
                        date: '2017-05-01T23:00:00.000Z'
                    }
                ],
                [
                    {
                        date: '2017-05-01T23:00:00.000Z'
                    },
                    {
                        date: '2016-09-01T23:00:00.000Z'
                    }
                ]
            ];

            assert.deepEqual(gren._createReleaseRanges(blocks), rangedBlocks, 'Given release blocks');

            gren.options.tags = 'all'
            assert.deepEqual(gren._createReleaseRanges(blocks), rangedBlocks.concat([[
                {
                    date: '2016-09-01T23:00:00.000Z',
                },
                {
                    id: 0,
                    date: new Date(0)
                }
            ]]), 'Given release blocks with all tags option in');
        });
    });

    describe('Issues and PRs', () => {
        let PRs, issues;

        before(() => {
            gren.options.template.issue = '{{name}}';
            gren.options.template.group = '{{heading}}';
            gren.options.template.noLabel = 'closed';

            const issueFile = requireConfig(process.cwd() + '/test/data/issues.json');
            PRs = requireConfig(process.cwd() + '/test/data/PRs.json');

            issues = {
                normal: issueFile.filter(({ id }) => id === 234567890),
                noMilestone: issueFile.filter(({ id }) => id === 234567891),
                noLabel: issueFile.filter(({ id }) => id === 234567891)
            };
        });

        describe('_groupBy, _groupByLabel', () => {
            it('Should return the just templated issues', () => {
                const { normal } = issues;

                gren.options.groupBy = false;
                assert.deepEqual(gren._groupBy(normal), [normal[0].title], 'The groupBy option is false');
            });

            it('Should return the group based on issue labels', () => {
                const { normal, noLabel } = issues;

                gren.options.groupBy = 'label';
                assert.deepEqual(gren._groupBy(normal), [`${normal[0].labels[0].name}\n${normal[0].title}`], 'Group option is "label"');
                assert.deepEqual(gren._groupBy(noLabel), [`closed\n${noLabel[0].title}`], 'Group option is "label" with no labels');
            });

            it('Should group the issues based on the option', () => {
                const { normal, noLabel } = issues;

                gren.options.groupBy = {
                    'Test': ['enhancement'],
                    'Others': ['closed']
                };
                assert.deepEqual(gren._groupBy(normal), [`Test\n${normal[0].title}`], 'Passing one heading for one issue');
                assert.deepEqual(gren._groupBy(noLabel), [`Others\n${noLabel[0].title}`], 'Group option is "label" with no labels');

                gren.options.groupBy = {
                    'No issues for this one': ['this does not exist']
                };
                assert.deepEqual(gren._groupBy(normal), [], 'Passing one heading that does not match any labels');

                gren.options.groupBy = {
                    'All': ['...']
                };
                assert.deepEqual(gren._groupBy(normal), [`All\n${normal[0].title}`], 'The issue does not match any labels, and goes in the ... group');
            });
        });

        describe('_filterIssue', () => {
            it('Should not return the wrong issue', () => {
                const { normal, noMilestone } = issues;

                assert.isNotOk(gren._filterIssue(PRs[0]), 'PRs are not included');

                gren.options.ignoreIssuesWith = ['enhancement'];
                assert.isNotOk(gren._filterIssue(normal[0]), 'Issue contains an ignore label');

                gren.options.ignoreIssuesWith = [];

                gren.options.onlyMilestones = true;
                assert.isNotOk(gren._filterIssue(noMilestone[0]), 'Issue without milestone, with onlyMilestone as true');

                gren.options.onlyMilestones = false;
                gren.options.dataSource = 'milestones';
                assert.isNotOk(gren._filterIssue(noMilestone[0]), 'Issue without milestone, with dataSource as milestone');
            });
        });

        describe('_templateIssueBody', () => {
            it('Should always return a string', () => {
                const body = [
                    'First',
                    'Second',
                    'Third'
                ];
                const rangeBody = 'This is one body';

                assert.isString(gren._templateIssueBody(body), 'Passing only the body');
                assert.isString(gren._templateIssueBody(false, rangeBody), 'Passing only the rangeBody');
                assert.isString(gren._templateIssueBody(), 'No parameters');
                assert.isString(gren._templateIssueBody('This is not an Array!'), 'No parameters');
            });
        });

        describe('_lablesAreIgnored', () => {
            it('Should return false on unsupported paramater', () => {
                assert.isNotOk(gren._lablesAreIgnored([]), 'The variable is empty');
                assert.isNotOk(gren._lablesAreIgnored(false), 'The variable is false');
                assert.isNotOk(gren._lablesAreIgnored(true), 'The variable is true');
                assert.isNotOk(gren._lablesAreIgnored({a: 1, b: 2}), 'The variable is an Object');
                assert.isNotOk(gren._lablesAreIgnored({}), 'The variable is an empty Object');
                assert.isNotOk(gren._lablesAreIgnored('string'), 'The variable is a string');
                assert.isNotOk(gren._lablesAreIgnored([1, 2, 3]), 'The variable is a Array of invalid data');
            });

            it('Should return false if none of the label names are included', () => {
                gren.options.ignoreIssuesWith = ['c'];
                assert.isNotOk(gren._lablesAreIgnored([{name: 'a'}, {name: 'b'}]), 'None of the names match');
                assert.isNotOk(gren._lablesAreIgnored([{name: 'ac'}, {name: 'b'}]), 'Part of the name is in a label name');
            });

            it('Should return true if it finds any label name', () => {
                gren.options.ignoreIssuesWith = ['c', 'd'];
                assert.isOk(gren._lablesAreIgnored([{name: 'c'}, { name: 'd'}]), 'All the labels match');
                assert.isOk(gren._lablesAreIgnored([{name: 'c'}, { name: 'e'}]), 'Only one of the labels match');
                assert.isOk(gren._lablesAreIgnored([{name: 'c'}, 1]), 'Only one of the labels match and is valid data');
            });
        });
    });

    describe('Tags', () => {
        let tags;

        before(() => {
            tags = requireConfig(process.cwd() + '/test/data/tags.json');
        });

        describe('_getSelectedTags', () => {
            // gren.options.tags = [2, 1];
            it('Should return all the tags', () => {
                gren.options.tags = 'all';
                assert.deepEqual(gren._getSelectedTags(tags), tags, 'The tags option is all');
            });

            it('Should return false', () => {
                gren.options.tags = [];
                assert.isNotOk(gren._getSelectedTags(tags), 'The tags option is an empty Array');

                assert.isNotOk(gren._getSelectedTags(false), 'Passing false');
                assert.isNotOk(gren._getSelectedTags([]), 'Passing empty Array');
            });

            it('Should return an Array of two/one tags', () => {
                gren.options.tags = 'all';
                assert.isArray(gren._getSelectedTags(tags), 'Passing all the tags');

                gren.options.tags = ['0.9.0', '0.8.1'];
                assert.lengthOf(gren._getSelectedTags(tags), 2, 'Passing all the tags');
                assert.lengthOf(gren._getSelectedTags(tags.slice(0, 1)), 1, 'Passing just one tag');
                assert.lengthOf(gren._getSelectedTags(tags.slice(0, 2)), 2, 'Passing two tags');

                gren.options.tags = ['0.9.0'];
                assert.lengthOf(gren._getSelectedTags(tags), 2, 'Passing all the tags');
                assert.lengthOf(gren._getSelectedTags(tags.slice(0, 2)), 2, 'Passing two tags');
                assert.lengthOf(gren._getSelectedTags(tags.slice(0, 1)), 1, 'Passing one tags');
            });

            it('Should filter the tags with the selected ones', () => {
                const nine = tags.filter(({ name }) => name === '0.9.0')[0];
                const eight = tags.filter(({ name }) => name === '0.8.1')[0];
                const seven = tags.filter(({ name }) => name === '0.7.0')[0];

                gren.options.tags = ['0.9.0', '0.7.0'];
                assert.deepEqual(gren._getSelectedTags(tags), [nine, seven], 'Two tags as options');

                gren.options.tags = ['0.9.0'];
                assert.deepEqual(gren._getSelectedTags(tags), [nine, eight], 'One tag as options');

                gren.options.tags = ['0.9.0', '0.7.0', '0.3.0'];
                assert.deepEqual(gren._getSelectedTags(tags), [nine, seven], 'Three tags as options');
            });
        });
    });

    describe('_generateCommitsBody, _templateCommits, _filterCommit', () => {
        let commitMessages;

        before(() => {
            commitMessages = [
                {
                    commit: {
                        message: "First commit"
                    }
                },
                {
                    commit: {
                        message: "This is another commit"
                    }
                },
                {
                    commit: {
                        message: "Merge branch into master: Something else here to be tested"
                    }
                },
                {
                    commit: {
                        message: "This is the last one"
                    }
                }
            ];

            // This makes the test easier
            gren.options.template.commit = '{{message}}';
        });

        it('Should always return a string', () => {
            assert.isString(gren._generateCommitsBody(commitMessages), 'Passing Array');
            assert.isString(gren._generateCommitsBody([]), 'Passing empty Array');
            assert.isString(gren._generateCommitsBody(false), 'Passing false');
            assert.isString(gren._generateCommitsBody(), 'No parameters');
            assert.isString(gren._generateCommitsBody(true), 'Passing true');
        });

        it('Should not return the last message', () => {
            assert.notInclude(gren._generateCommitsBody(commitMessages), commitMessages.slice(-1)[0], 'Generate the messages');
            assert.deepEqual(gren._generateCommitsBody([{ commit: { message: 'One message' }}]), 'One message', 'One message passed');
            assert.deepEqual(gren._generateCommitsBody([{ commit: { message: 'One' }}, { commit: { message: 'Two' }}]), 'One', 'Two message passed');
            assert.deepEqual(gren._generateCommitsBody([{ commit: { message: 'One' }}, { commit: { message: 'Two' }}, { commit: { message: 'Three' }}]), 'One\nTwo', 'Three message passed');
        });

        it('Should only return the messages defined in the options', () => {
            gren.options.includeMessages = 'commits';
            assert.deepEqual(gren._generateCommitsBody(commitMessages), `${commitMessages[0].commit.message}\n${commitMessages[1].commit.message}`, 'Using commits as includeMessages');

            gren.options.includeMessages = 'all';
            assert.deepEqual(gren._generateCommitsBody(commitMessages), `${commitMessages[0].commit.message}\n${commitMessages[1].commit.message}\n${commitMessages[2].commit.message}`, 'Using commits as includeMessages');

            gren.options.includeMessages = 'merges';
            assert.deepEqual(gren._generateCommitsBody(commitMessages), commitMessages[2].commit.message, 'Using commits as includeMessages');
        });
    });

    describe('_checkChangelogFile', () => {
        before(() => {
            gren.options.changelogFilename = 'test/.temp/CHANGELOG.md';
        });

        it('Should reject if the file does not exists ', done => {
            gren._checkChangelogFile()
                .then(done)
                .catch(err => {
                    assert.isOk(err);

                    done();
                });
        });

        it('Should reject if the file does not exists ', done => {
            fs.writeFileSync(gren.options.changelogFilename, 'Test');

            gren._checkChangelogFile()
                .then(() => {
                    done();
                }).catch(() => done());
        });

        afterEach(() => {
            if (fs.existsSync(gren.options.changelogFilename)) {
                fs.unlinkSync(gren.options.changelogFilename);
            }
        });
    });

    describe('_createChangelog', () => {
        before(() => {
            gren.options.changelogFilename = 'test/.temp/CHANGELOG.md';
        });

        it('Should create the changelog file', () => {
            const changelogBody = 'This is the body.';

            gren._createChangelog(changelogBody);

            assert.isOk(fs.existsSync(gren.options.changelogFilename), 'Create the file');
            assert.deepEqual(fs.readFileSync(gren.options.changelogFilename, 'utf-8'), gren.options.template.changelogTitle + changelogBody, 'Add the right body to the changelog file');
        });

        afterEach(() => {
            if (fs.existsSync(gren.options.changelogFilename)) {
                fs.unlinkSync(gren.options.changelogFilename);
            }
        });
    });

    describe('Tests that require network', () => {
        before(function(done) {
            gren._hasNetwork()
                .then(isOnline => {
                    if (!isOnline) {
                        process.stdout.write(chalk.red('\nYou need network connectivity to run the following tests:\n'));

                        this.skip();
                    }

                    done();
                })
                .catch(err => done(err));
        });

        it('_getReleaseBlocks', done => {
            gren._getReleaseBlocks()
                .then(releaseBlocks => {
                    assert.isArray(releaseBlocks, 'The releaseBlocks is an Array');
                    releaseBlocks.forEach(block => {
                        assert.hasAllKeys(block, ['id', 'release', 'name', 'published_at', 'body']);
                    });
                    done();
                })
                .catch(err => done(err));
        }).timeout(5000);
    });
});
