import chalk from 'chalk';
import Github from 'github-api';
import utils from './_utils.js';
import { generate } from './_template.js';
import connectivity from 'connectivity';
import templateConfig from './templates.json';
import ObjectAssign from 'object-assign-deep';

const defaults = {
    template: templateConfig
};

export default class Release {
    constructor(props) {
        this.options = ObjectAssign({}, defaults, props);

        if (!this.options.token) {
            throw chalk.red('You need to provide the token');
        }

        const githubApi = new Github({
            token: this.options.token
        }, this.options.apiUrl);

        this.tasks = [];
        this.repo = githubApi.getRepo(this.options.username, this.options.repo);
        this.issues = githubApi.getIssues(this.options.username, this.options.repo); // ?? not sure if I need this.

        this.options.tags = utils.convertStringToArray(this.options.tags);
        this.options.ignoreLabels = utils.convertStringToArray(this.options.ignoreLabels);
        this.options.ignoreIssuesWith = utils.convertStringToArray(this.options.ignoreIssuesWith);
    }

    release() {
        // print task
        return this.getReleaseBlocks()
            .then((blocks) => blocks.reduce((carry, block) => carry.then(this.prepareRelease.bind(this, block)), Promise.resolve()));
    }

    /**
     * Edit a release from a given tag (in the options)
     *
     * @since 0.5.0
     * @private
     *
     * @param  {number} releaseId The id of the release to edit
     * @param  {Object} releaseOptions The options to build the release:
     * @example
     * {
     *   "tag_name": "v1.0.0",
     *   "target_commitish": "master",
     *   "name": "v1.0.0",
     *   "body": "Description of the release",
     *   "draft": false,
     *   "prerelease": false
     * }
     *
     * @return {Promise}
     */
    editRelease(releaseId, releaseOptions) {
        const loaded = utils.task(this, 'Updating latest release');

        return this.repo.updateRelease(releaseId, releaseOptions)
            .then((response) => {
                loaded();

                const release = response.data;

                console.log(chalk.green(release.name + ' has been successfully updated!'));

                return release;
            });
    }

    /**
     * Create a release from a given tag (in the options)
     *
     * @since 0.1.0
     * @private
     *
     * @param  {Object} releaseOptions The options to build the release:
     * @example {
     *   "tag_name": "1.0.0",
     *   "target_commitish": "master",
     *   "name": "v1.0.0",
     *   "body": "Description of the release",
     *   "draft": false,
     *   "prerelease": false
     * }
     *
     * @return {Promise}
     */
    createRelease(releaseOptions) {
        const loaded = utils.task(this, 'Preparing the release');

        return this.repo.createRelease(releaseOptions)
            .then((response) => {
                loaded();
                const release = response.data;

                console.log(chalk.green(release.name + ' has been successfully created!'));

                return release;
            });
    }

    /**
     * Creates the options to make the release
     *
     * @since 0.2.0
     * @private
     *
     * @param  {Object[]} tags The collection of tags
     *
     * @return {Promise}
     */
    prepareRelease(block) {
        const releaseOptions = {
            tag_name: block.release,
            name: block.name,
            body: block.body,
            draft: this.options.draft,
            prerelease: this.options.prerelease
        };

        if (block.id) {
            if (!this.options.override) {
                console.warn(chalk.black(chalk.bgYellow('Skipping ' + block.release + ' (use --override to replace it)')));

                return Promise.resolve();
            }

            return this.editRelease(block.id, releaseOptions);
        }

        return this.createRelease(releaseOptions);
    }

    /**
     * Get the tags information from the given ones, and adds
     * the next one in case only one is given
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Array|string} selectedTags
     * @param  {Object[]} tags
     *
     * @return {Boolean|Array}
     */
    getSelectedTags(optionTags = [], tags) {
        if (optionTags.indexOf('all') >= 0) {
            return tags;
        }

        if (!optionTags.length) {
            return false;
        }

        const selectedTags = [].concat(optionTags);

        return tags.filter((tag, index) => {
            const isSelectedTag = selectedTags.indexOf(tag.name) !== -1;

            if (isSelectedTag && selectedTags.length === 1 && tags[index + 1]) {
                selectedTags.push(tags[index + 1].name);
            }
            return isSelectedTag;
        }).slice(0, 2);
    }

    /**
     * Get all the tags of the repo
     *
     * @since 0.1.0
     * @private
     *
     * @return {Promise}
     */
    getLastTags(releases) {
        const loaded = utils.task(this, 'Getting tags');

        return this.repo.listTags()
            .then((response) => {
                loaded();

                const tags = response.data;
                const filteredTags = (this.getSelectedTags(this.options.tags, tags) || [tags[0], tags[1]])
                    .filter(Boolean)
                    .map((tag) => {
                        const tagRelease = releases ? releases.filter((release) => release.tag_name === tag.name)[0] : false;
                        const releaseId = tagRelease ? tagRelease.id : null;

                        return {
                            tag: tag,
                            releaseId: releaseId
                        };
                    });

                console.log('Tags found: ' + filteredTags.map((tag) => tag.tag.name).join(', '));

                return filteredTags;
            });
    }

    /**
     * Get the dates of the last two tags
     *
     * @since 0.1.0
     * @private
     *
     * @param  {Object[]} tags List of all the tags in the repo
     *
     * @return {Promise[]}     The promises which returns the dates
     */
    getTagDates(tags) {
        return tags.map((tag) => this.repo.getCommit(tag.tag.commit.sha)
            .then((response) => ({
                id: tag.releaseId,
                name: tag.tag.name,
                date: response.data.committer.date
            })));
    }

    /**
     * Get all releases
     *
     * @since 0.5.0
     * @private
     *
     * @return {Promise} The promise which resolves an array of releases
     */
    getListReleases() {
        const loaded = utils.task(this, 'Getting the list of releases');

        return this.repo.listReleases()
            .then((response) => {
                loaded();

                const releases = response.data;

                process.stdout.write(releases.length + ' releases found\n');

                return releases;
            });
    }

    /**
     * Return the templated commit message
     *
     * @since 0.1.0
     * @private
     *
     * @param  {string} message
     *
     * @return {string}
     */
    templateCommits(message) {
        return generate({
            message: message
        }, this.options.template.commit);
    }

    /**
     * Generate the MD template from all the labels of a specific issue
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Object} issue
     *
     * @return {string}
     */
    templateLabels(issue) {
        if (!issue.labels.length && this.options.template.noLabel) {
            issue.labels.push({name: this.options.template.noLabel});
        }

        return issue.labels
            .filter((label) => this.options.ignoreLabels.indexOf(label.name) === -1)
            .map((label) => generate({
                label: label.name
            }, this.options.template.label)).join('');
    }

    /**
     * Generate the releases bodies from a release Objects Array
     *
     * @since 0.8.0
     * @private
     *
     * @param  {Array} releases The release Objects Array coming from GitHub
     *
     * @return {string}
     */
    templateReleases(releases) {
        return releases.map((release) => generate({
            release: release.name,
            date: utils.formatDate(new Date(release.published_at)),
            body: release.body
        }, this.options.template.release)).join(this.options.template.releaseSeparator);
    }

    /**
     * Generate the MD template for each issue
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Object} issue
     *
     * @return {string}
     */
    templateIssue(issue) {
        return generate({
            labels: this.templateLabels(issue),
            name: issue.title,
            text: '#' + issue.number,
            url: issue.html_url
        }, this.options.template.issue);
    }

    /**
     * Generate the Changelog issues body template
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Object[]} blocks
     *
     * @return {string}
     */
    templateIssueBody(body, rangeBody) {
        return (body.length ? body.join('\n') : rangeBody || '*No changelog for this release.*') + '\n';
    }

    /**
     * Generates the template for the groups
     *
     * @since  0.8.0
     * @private
     *
     * @param  {Object} groups The groups to template e.g.
     * {
     *     'bugs': [{...}, {...}, {...}]
     * }
     *
     * @return {string}
     */
    templateGroups(groups) {
        return Object.entries(groups).map(([key, value]) => {
            const heading = generate({
                heading: key
            }, this.options.template.group);
            const body = value.join('\n');

            return heading + '\n' + body;
        });
    }

    /**
     * Return a commit messages generated body
     *
     * @since 0.1.0
     * @private
     *
     * @param  {string} message
     *
     * @return {string}
     */
    generateCommitsBody(messages) {
        messages.length === 1 && messages.push(null);
        return messages
            .slice(0, -1)
            .filter((message) => {
                const messageType = this.options.includeMessages;
                const filterMap = {
                    merges: function(message) {
                        return message.match(/^merge/i);
                    },
                    commits: function(message) {
                        return !message.match(/^merge/i);
                    },
                    all: function() {
                        return true;
                    }
                };

                if (filterMap[messageType]) {
                    return filterMap[messageType](message);
                }

                return filterMap.commits(message);
            })
            .map(this.templateCommits.bind(this))
            .join('\n');
    }

    /**
     * Transforms the commits to commit messages
     *
     * @since 0.1.0
     * @private
     *
     * @param  {Object[]} commits The array of object containing the commits
     *
     * @return {String[]}
     */
    commitMessages(commits) {
        return commits.map((commitObject) => commitObject.commit.message);
    }

    /**
     * Gets all the commits between two dates
     *
     * @since 0.1.0
     * @private
     *
     * @param  {string} since The since date in ISO
     * @param  {string} until The until date in ISO
     *
     * @return {Promise}      The promise which resolves the [Array] commit messages
     */
    getCommitsBetweenTwo(since, until) {
        process.stdout.write(chalk.green('Get commits between ' + utils.formatDate(new Date(since)) + ' and ' + utils.formatDate(new Date(until)) + '\n'));

        const options = {
            since: since,
            until: until,
            per_page: 100
        };

        return this.repo.listCommits(options)
            .then((response) => this.commitMessages(response.data));
    }

    /**
     * Get the blocks of commits based on release dates
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Array} releaseRanges The array of date ranges
     *
     * @return {Promise[]}
     */
    getCommitBlocks(releaseRanges) {
        console.log(chalk.blue('\nCreating the body blocks from commits:'));

        return Promise.all(
            releaseRanges
                .map((range) => this.getCommitsBetweenTwo(range[1].date, range[0].date)
                    .then((commits) => ({
                        id: range[0].id,
                        name: this.options.prefix + range[0].name,
                        release: range[0].name,
                        published_at: range[0].date,
                        body: this.generateCommitsBody(commits) + '\n'
                    })))
        );
    }

    /**
     * Compare the ignored labels with the passed ones
     *
     * @since 0.6.0
     * @private
     *
     * @param  {Array} ignoreLabels    The labels to ignore
     * @param  {Array} labels   The labels to check
     *
     * @return {boolean}    If the labels array contain any of the ignore ones
     */
    compareIssueLabels(ignoreLabels, labels) {
        return ignoreLabels
            .reduce((carry, ignoredLabel) => carry && labels.map((label) => label.name).indexOf(ignoredLabel) === -1, true);
    }

    /**
     * Filter the issue based on gren options and labels
     *
     * @since 0.9.0
     * @private
     *
     * @param  {Object} issue
     *
     * @return {Boolean}
     */
    filterIssue(issue) {
        return !issue.pull_request && this.compareIssueLabels(this.options.ignoreIssuesWith, issue.labels) &&
            !((this.options.onlyMilestones || this.options.dataSource === 'milestones') && !issue.milestone);
    }

    /**
     * Get all the closed issues from the current repo
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Array} releaseRanges The array of date ranges
     *
     * @return {Promise} The promise which resolves the list of the issues
     */
    getClosedIssues(releaseRanges) {
        const loaded = utils.task(this, 'Getting all closed issues');

        return this.issues.listIssues({
            state: 'closed',
            since: releaseRanges[releaseRanges.length - 1][1].date
        })
            .then((response) => {
                loaded();

                const filteredIssues = response.data.filter(this.filterIssue.bind(this));

                process.stdout.write(filteredIssues.length + ' issues found\n');

                return filteredIssues;
            });
    }

    /**
     * Group the issues based on their first label
     *
     * @since 0.8.0
     * @private
     *
     * @param  {Array} issues
     *
     * @return {string}
     */
    groupByLabel(issues) {
        const groups = [];

        issues.forEach((issue) => {
            if (!issue.labels.length && this.options.template.noLabel) {
                issue.labels.push({name: this.options.template.noLabel});
            }

            const labelName = issue.labels[0].name;

            if (!groups[labelName]) {
                groups[labelName] = [];
            }

            groups[labelName].push(this.templateIssue(issue));
        });

        return this.templateGroups(utils.sortObject(groups));
    }

    /**
     * Create groups of issues based on labels
     *
     * @since  0.8.0
     * @private
     *
     * @param  {Array} issues The array of all the issues.
     *
     * @return {Array}
     */
    groupBy(issues) {
        const { groupBy } = this.options;

        if (!groupBy) {
            return issues.map(this.templateIssue.bind(this));
        }

        if (groupBy === 'label') {
            return this.groupByLabel(issues);
        }

        if (typeof groupBy !== 'object') {
            throw chalk.red('The option for groupBy is invalid, please check the documentation');
        }

        const allLabels = Object.keys(groupBy).reduce((carry, group) => carry.concat(groupBy[group]), []);

        const groups = Object.keys(groupBy).reduce((carry, group) => {
            const groupIssues = issues.filter((issue) => {
                if (!issue.labels.length && this.options.template.noLabel) {
                    issue.labels.push({name: this.options.template.noLabel});
                }

                return issue.labels.some((label) => {
                    const isOtherLabel = groupBy[group].indexOf('...') !== -1 && allLabels.indexOf(label.name) === -1;

                    return groupBy[group].indexOf(label.name) !== -1 || isOtherLabel;
                });
            }).map(this.templateIssue.bind(this));

            if (groupIssues.length) {
                carry[group] = groupIssues;
            }

            return carry;
        }, {});

        return this.templateGroups(groups);
    }

    /**
     * Filter the issue based on the date range, or if is in the release
     * milestone.
     *
     * @since 0.9.0
     * @private
     *
     * @param  {Array} range The release ranges
     * @param  {Object} issue GitHub issue
     *
     * @return {Boolean}
     */
    filterBlockIssue(range, issue) {
        if (this.options.dataSource === 'milestones') {
            return this.options.milestoneMatch.replace('{{tag_name}}', range[0].name) === issue.milestone.title;
        }

        return utils.isInRange(
            Date.parse(issue.closed_at),
            Date.parse(range[1].date),
            Date.parse(range[0].date)
        );
    }

    /**
     * Get the blocks of issues based on release dates
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Array} releaseRanges The array of date ranges
     *
     * @return {Promise[]}
     */
    getIssueBlocks(releaseRanges) {
        console.log('Creating the body blocks from releases:');

        return this.getClosedIssues(releaseRanges)
            .then((issues) => releaseRanges
                .map((range) => {
                    const filteredIssues = issues.filter(this.filterBlockIssue.bind(this, range));
                    const body = (!range[0].body || this.options.override) && this.groupBy(filteredIssues);

                    return {
                        id: range[0].id,
                        release: range[0].name,
                        name: this.options.prefix + range[0].name,
                        published_at: range[0].date,
                        body: this.templateIssueBody(body, range[0].body)
                    };
                }));
    }

    /**
     * Sort releases by dates
     *
     * @since 0.5.0
     * @private
     *
     * @param {Array} releaseDates
     *
     * @return {Array}
     */
    sortReleasesByDate(releaseDates) {
        return releaseDates.sort((release1, release2) => new Date(release2.date) - new Date(release1.date));
    }

    /**
     * Create the ranges of release dates
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Array} releaseDates The release dates
     *
     * @return {Array}
     */
    createReleaseRanges(releaseDates) {
        const ranges = [];
        const range = 2;
        const sortedReleaseDates = this.sortReleasesByDate(releaseDates);

        if (sortedReleaseDates.length === 1) {
            sortedReleaseDates.push({
                id: 0,
                date: new Date(0)
            });
        }

        for (let i = 0; i < sortedReleaseDates.length - 1; i++) {
            ranges.push(sortedReleaseDates.slice(i, i + range));
        }

        return ranges;
    }

    /**
     * Generate release blocks based on issues or commit messages
     * depending on the option.
     *
     * @return {Promise} Resolving the release blocks
     */
    getReleaseBlocks() {
        let loaded;
        const dataSource = {
            issues: this.getIssueBlocks.bind(this),
            commits: this.getCommitBlocks.bind(this),
            milestones: this.getIssueBlocks.bind(this)
        };

        return this.getListReleases()
            .then((releases) => this.getLastTags(releases.length ? releases : false))
            .then((tags) => {
                loaded = utils.task(this, 'Getting the tag dates ranges');

                return Promise.all(this.getTagDates(tags));
            })
            .then((releaseDates) => {
                loaded();

                return dataSource[this.options.dataSource](
                    this.createReleaseRanges(releaseDates)
                );
            });
    }

    /**
     * Check if there is connectivity
     *
     * @since 0.5.0
     * @private
     *
     * @return {Promise}
     */
    _hasNetwork() {
        return new Promise(resolve => {
            connectivity(isOnline => {
                if (!isOnline) {
                    console.warn(chalk.yellow('WARNING: Looks like you don\'t have network connectivity!'));
                }

                resolve();
            });
        });
    }
}
