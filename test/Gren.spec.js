import { assert } from 'chai';
import chalk from 'chalk';
import fs from 'fs';
import Gren from '../lib/src/Gren.js';
import { requireConfig } from '../lib/src/_utils.js';

const TOKEN = process.env.GREN_GITHUB_TOKEN;

if (!TOKEN) {
    console.log(chalk.blue('Token not present, skipping Gren tests.'));
    describe = describe.skip;
}

describe('Gren', () => {
    let gren;

    before(() => {
        gren = new Gren({
            token: TOKEN,
            username: 'github-tools',
            repo: 'github-release-notes',
            quiet: true
        });
    });

    it('Should throw an error', () => {
        process.env.GREN_GITHUB_TOKEN = null;

        const grenWithoutToken = () => new Gren();
        assert.throws(grenWithoutToken, chalk.red('You must provide the TOKEN'), 'No token passed');
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

            gren.options.tags = 'all';
            assert.deepEqual(gren._createReleaseRanges(blocks), rangedBlocks.concat([[
                {
                    date: '2016-09-01T23:00:00.000Z'
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
                noLabel: issueFile.filter(({ id }) => id === 234567891),
                pullRequests: issueFile.filter(({ pull_request }) => pull_request)
            };
        });

        describe('_getLastPage', () => {
            it('Should return the number of the last page', () => {
                const link = '<https://api.github.com/search/code?q=addClass+user%3Amozilla&page=2>; rel="next", <https://api.github.com/search/code?q=addClass+user%3Amozilla&page=34>; rel="last"';

                assert.deepEqual(gren._getLastPage(link), 34, 'String of pages');
            });

            it('Should return false', () => {
                assert.isNotOk(gren._getLastPage(), 'Nothing has been passed');
                assert.isNotOk(gren._getLastPage('Lorem ipsum'), 'The string does not contain the page information');
                assert.isNotOk(gren._getLastPage(false), 'False has been passed');
            });
        });

        describe('_groupBy, _groupByLabel', () => {
            it('Should return the just templated issues', () => {
                const { normal, noLabel } = issues;

                gren.options.groupBy = false;
                assert.deepEqual(gren._groupBy(normal), [normal[0].title], 'The groupBy option is false');
                assert.deepEqual(gren._groupBy(noLabel), [noLabel[0].title], 'The groupBy option is false');
            });

            it('Should return the group based on issue labels', () => {
                const { normal, noLabel } = issues;

                gren.options.groupBy = 'label';
                assert.deepEqual(gren._groupBy(normal), [`${normal[0].labels[0].name}\n${normal[0].title}`], 'Group option is "label"');
                assert.deepEqual(gren._groupBy(noLabel), [`closed\n${noLabel[0].title}`], 'Group option is "label" with no labels');
            });

            it('Should not return labels without labels', () => {
                const { normal, noLabel } = issues;

                gren.options.template.noLabel = false;
                gren.options.groupBy = 'label';

                assert.lengthOf(gren._groupBy(noLabel), 0, 'When the noLabel is false and only an issue with no labels has been passed');
                assert.lengthOf(gren._groupBy(noLabel.concat(normal)), 1, 'When the noLabel is false and only one issue with labels has been passed');
            });

            it('Should throw an error', () => {
                const error = chalk.red('The option for groupBy is invalid, please check the documentation');

                gren.options.groupBy = 'an unrecognised string';
                assert.throws(gren._groupBy.bind(gren, issues), error, 'Passing an unrecognised string');

                gren.options.groupBy = [1, 2, 3];
                assert.throws(gren._groupBy.bind(gren, issues), error, 'Passing an Array');

                gren.options.groupBy = 123;
                assert.throws(gren._groupBy.bind(gren, issues), error, 'Passing a number');
            });

            it('Should group the issues based on the option', () => {
                const { normal, noLabel } = issues;

                gren.options.template.noLabel = 'closed';

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

                gren.options.dataSource = 'prs';
                assert.isNotOk(gren._filterIssue(normal[0]), 'Issue are not included, with dataSource as prs');
            });

            it('Should include pull requests', () => {
                gren.options.dataSource = 'prs';
                assert.isOk(gren._filterIssue(issues.pullRequests[0]), 'Pull Requests are included, with dataSource as prs');
            });
        });

        describe('_templateBody', () => {
            it('Should always return a string', () => {
                const body = [
                    'First',
                    'Second',
                    'Third'
                ];
                const rangeBody = 'This is one body';

                assert.isString(gren._templateBody(body), 'Passing only the body');
                assert.isString(gren._templateBody(false, rangeBody), 'Passing only the rangeBody');
                assert.isString(gren._templateBody(), 'No parameters');
                assert.isString(gren._templateBody('This is not an Array!'), 'No parameters');
            });
        });

        describe('_lablesAreIgnored', () => {
            it('Should return false on unsupported paramater', () => {
                assert.isNotOk(gren._lablesAreIgnored([]), 'The variable is empty');
                assert.isNotOk(gren._lablesAreIgnored(false), 'The variable is false');
                assert.isNotOk(gren._lablesAreIgnored(true), 'The variable is true');
                assert.isNotOk(gren._lablesAreIgnored({ a: 1, b: 2 }), 'The variable is an Object');
                assert.isNotOk(gren._lablesAreIgnored({}), 'The variable is an empty Object');
                assert.isNotOk(gren._lablesAreIgnored('string'), 'The variable is a string');
                assert.isNotOk(gren._lablesAreIgnored([1, 2, 3]), 'The variable is a Array of invalid data');
            });

            it('Should return false if none of the label names are included', () => {
                gren.options.ignoreIssuesWith = ['c'];
                assert.isNotOk(gren._lablesAreIgnored([{ name: 'a' }, { name: 'b' }]), 'None of the names match');
                assert.isNotOk(gren._lablesAreIgnored([{ name: 'ac' }, { name: 'b' }]), 'Part of the name is in a label name');
            });

            it('Should return true if it finds any label name', () => {
                gren.options.ignoreIssuesWith = ['c', 'd'];
                assert.isOk(gren._lablesAreIgnored([{ name: 'c' }, { name: 'd' }]), 'All the labels match');
                assert.isOk(gren._lablesAreIgnored([{ name: 'c' }, { name: 'e' }]), 'Only one of the labels match');
                assert.isOk(gren._lablesAreIgnored([{ name: 'c' }, 1]), 'Only one of the labels match and is valid data');
            });
        });
    });

    describe('Tags', () => {
        let tags;

        before(() => {
            tags = requireConfig(process.cwd() + '/test/data/tags.json');
        });

        describe('_getSelectedTags', () => {
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
            gren.options.template.commit = '{{message}} - {{author}}';

            commitMessages = [
                {
                    commit: {
                        message: 'First commit',
                    },
                    author: {
                        login: 'alexcanessa'
                    }
                },
                {
                    commit: {
                        message: 'This is another commit',
                    },
                    author: {
                        login: 'alexcanessa'
                    }
                },
                {
                    commit: {
                        message: 'Merge branch into master: Something else here to be tested',
                    },
                    author: {
                        login: 'alexcanessa'
                    }
                },
                {
                    commit: {
                        message: 'This is the last one',
                    },
                    author: {
                        login: 'alexcanessa'
                    }
                }
            ];
        });

        it('Should always return a string', () => {
            assert.isString(gren._generateCommitsBody(commitMessages), 'Passing Array');
            assert.isString(gren._generateCommitsBody([]), 'Passing empty Array');
            assert.isString(gren._generateCommitsBody(false), 'Passing false');
            assert.isString(gren._generateCommitsBody(), 'No parameters');
            assert.isString(gren._generateCommitsBody(true), 'Passing true');
        });

        it('Should not return the last message', () => {
            const lastMessage = commitMessages.slice(-1)[0];

            assert.notInclude(gren._generateCommitsBody(commitMessages), `${lastMessage.commit.message} - ${lastMessage.author.login}`, 'Generate the messages');
            assert.deepEqual(gren._generateCommitsBody([{
                commit: {
                    message: 'One message'
                },
                author: {
                    login: 'alexcanessa'
                }
            }]), 'One message - alexcanessa', 'One message passed');
            assert.deepEqual(gren._generateCommitsBody([{
                commit: {
                    message: 'One'
                },
                author: {
                    login: 'alexcanessa'
                }
            },
            {
                commit: {
                    message: 'Two'
                },
                author: {
                    login: 'alexcanessa'
                }
            }]), 'One - alexcanessa', 'Two message passed');
            assert.deepEqual(gren._generateCommitsBody([{
                commit: {
                    message: 'One'
                },
                author: {
                    login: 'alexcanessa'
                }
            },
            {
                commit: {
                    message: 'Two'
                },
                author: {
                    login: 'alexcanessa'
                }
            },
            {
                commit: {
                    message: 'Three'
                },
                author: {
                    login: 'alexcanessa'
                }
            }]), 'One - alexcanessa\nTwo - alexcanessa', 'Three message passed');
        });

        it('Should only return the messages defined in the options', () => {
            gren.options.includeMessages = 'commits';

            const messages = msg => `${commitMessages[msg].commit.message} - ${commitMessages[msg].author.login}`;

            assert.deepEqual(gren._generateCommitsBody(commitMessages), `${messages(0)}\n${messages(1)}`, 'Using commits as includeMessages');

            gren.options.includeMessages = 'all';
            assert.deepEqual(gren._generateCommitsBody(commitMessages), `${messages(0)}\n${messages(1)}\n${messages(2)}`, 'Using commits as includeMessages');

            gren.options.includeMessages = 'merges';
            assert.deepEqual(gren._generateCommitsBody(commitMessages), messages(2), 'Using commits as includeMessages');
        });

        it('Should not return commits with ignored words', () => {
            gren.options.ignoreCommitsWith = ['another'];

            const messages = msg => `${commitMessages[msg].commit.message} - ${commitMessages[msg].author.login}`;

            assert.notInclude(commitMessages.filter(message => gren._filterCommit(message)), messages(1), 'Ignore another');
        });
    });

    describe('_checkChangelogFile', () => {
        before(() => {
            gren.options.changelogFilename = 'test/.temp/CHANGELOG.md';
        });

        beforeEach(() => {
            if (fs.existsSync(gren.options.changelogFilename)) {
                fs.unlinkSync(gren.options.changelogFilename);
            }
        });

        it('Should reject if the file does not exists ', () => {
            fs.writeFileSync(gren.options.changelogFilename, 'Test');

            const err = chalk.black(chalk.bgYellow('Looks like there is already a changelog, to override it use --override'));

            assert.throws(() => gren._checkChangelogFile(), err, 'The function throws the error');
        });

        it('Should return the filepath if the file exists ', () => {
            assert.isOk(gren._checkChangelogFile(), 'The file exists');
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
    })

    describe('_validateRequiredTagsExists', () => {
        it('should failed if one tag is missing', () => {
            const existingTagName = 'existing_tag';
            const existingTag = { tag: { name: existingTagName } };
            const expectedException = chalk.red('\nThe following tag is not found in the repository: some_tag. please provide existing tags.');
            assert.throw(() => gren._validateRequiredTagsExists([existingTag], ['some_tag', 'existing_tag']), expectedException);
        });

        it('should failed if the two input tags are missing', () => {
            const expectedException = chalk.red('\nThe following tags are not found in the repository: some_tag,some_other_tag. please provide existing tags.');
            assert.throw(() => gren._validateRequiredTagsExists([], ['some_tag', 'some_other_tag']), expectedException);
        });

        it('Should do nothing if requireTags=all', () => {
            assert.doesNotThrow(() => gren._validateRequiredTagsExists([], 'all'));
        });
    });

    describe('Tests that require network', () => {
        before(function (done) {
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

        it('_listReleases', done => {
            gren._listReleases({
                per_page: 10
            })
                .then(({ data: releases }) => {
                    assert.lengthOf(releases, 10, 'The list of releases is the set one.');
                    done();
                })
                .catch(err => done(err));
        });

        it('_listTags', done => {
            gren._listTags({
                per_page: 10
            })
                .then(({ data: tags }) => {
                    assert.lengthOf(tags, 10, 'The list of tags is the set one.');
                    done();
                })
                .catch(err => done(err));
        });

        describe('_getLastTags', () => {
            describe('with tags=all', () => {
                describe('with ignoreTagsWith', () => {
                    it('should ignore the specific tag', done => {
                        gren.options.ignoreTagsWith = ['11'];
                        gren.options.tags = ['all'];
                        gren._getLastTags()
                            .then(tags => {
                                assert.notInclude(tags.map(({ name }) => name), '0.11.0', 'The ignored tag is not present');
                                done();
                            })
                            .catch(err => done(err));
                    });
                });
            });
        });

        it('_getReleaseBlocks', done => {
            gren.options.tags = ['0.12.0', '0.11.0'];
            gren._getReleaseBlocks()
                .then(releaseBlocks => {
                    assert.isArray(releaseBlocks, 'The releaseBlocks is an Array');
                    releaseBlocks.forEach(block => {
                        assert.hasAllKeys(block, ['id', 'release', 'name', 'published_at', 'body']);
                    });
                    done();
                })
                .catch(err => done(err));
        }).timeout(10000);
    });
});
