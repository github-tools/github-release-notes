import chalk from 'chalk';
import Github from 'github-api';
import utils from './_utils.js';
import { generate } from './_template.js';
import connectivity from 'connectivity';
import templateConfig from './templates.json';
import ObjectAssign from 'object-assign-deep';
import fs from 'fs';

const defaults = {
    tags: [],
    prefix: '',
    template: templateConfig,
    prerelease: false,
    generate: false,
    override: false,
    ignoreLabels: false,
    ignoreIssuesWith: false,
    groupBy: false,
    milestoneMatch: 'Release {{tag_name}}'
};

/** Class creating release notes and changelog notes */
class Gren {
    constructor(props) {
        this.options = ObjectAssign({}, defaults, props);
        this.tasks = [];

        const { username, repo, token, apiUrl, tags, ignoreLabels, ignoreIssuesWith } = this.options;

        this.options.tags = utils.convertStringToArray(tags);
        this.options.ignoreLabels = utils.convertStringToArray(ignoreLabels);
        this.options.ignoreIssuesWith = utils.convertStringToArray(ignoreIssuesWith);

        if (!token) {
            throw chalk.red('You must provide the TOKEN');
        }

        const githubApi = new Github({
            token
        }, apiUrl);

        this.repo = githubApi.getRepo(username, repo);
        this.issues = githubApi.getIssues(username, repo);
    }

    /**
     * Generate release notes and draft a new release
     *
     * @since  0.10.0
     * @public
     *
     * @return {Promise}
     */
    release() {
        utils.printTask('Generate release notes');

        return this._hasNetwork()
            .then(this._getReleaseBlocks.bind(this))
            .then(blocks => blocks.reduce((carry, block) => carry.then(this._prepareRelease.bind(this, block)), Promise.resolve()));
    }

    /**
     * Generate changelog file based on the release notes or generate new one
     *
     * @since  0.10.0
     * @public
     *
     * @return {Promise}
     */
    changelog() {
        utils.printTask('Generate changelog file');

        return this._hasNetwork()
            .then(this._checkChangelogFile.bind(this))
            .then(() => {
                if (this.options.generate) {
                    return this._getReleaseBlocks();
                }

                return this._getListReleases();
            })
            .then(releases => {
                if (releases.length === 0) {
                    throw chalk.red('There are no releases, use --generate to create release notes, or run the release command.');
                }

                return Promise.resolve(releases);
            })
            .then(releases => {
                this._createChangelog(this._templateReleases(releases));
            });
    }

    /**
     * Check if the changelog file exists
     *
     * @since 0.8.0
     * @private
     *
     * @return {Promise}
     */
    _checkChangelogFile() {
        const filePath = process.cwd() + '/' + this.options.changelogFilename;

        if (fs.existsSync(filePath) && !this.options.override) {
            return Promise.reject(chalk.black(chalk.bgYellow('Looks like there is already a changelog, to override it use --override')));
        }

        return Promise.resolve();
    }

    /**
     * Create the changelog file
     *
     * @since 0.8.0
     * @private
     *
     * @param  {string} body The body of the file
     */
    _createChangelog(body) {
        const filePath = process.cwd() + '/' + this.options.changelogFilename;

        fs.writeFileSync(filePath, this.options.template.changelogTitle + body);

        console.log(chalk.green(`\nChangelog created in ${filePath}`));
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
    _editRelease(releaseId, releaseOptions) {
        const loaded = utils.task(this, 'Updating latest release');

        return this.repo.updateRelease(releaseId, releaseOptions)
            .then(response => {
                loaded();

                const release = response.data;

                console.log(chalk.green(`\n${release.name} has been successfully updated!`));
                console.log(chalk.blue(`See the results here: ${release.html_url}`));

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
    _createRelease(releaseOptions) {
        const loaded = utils.task(this, 'Preparing the release');

        return this.repo.createRelease(releaseOptions)
            .then(response => {
                loaded();
                const release = response.data;

                console.log(chalk.green(`\n${release.name} has been successfully created!`));
                console.log(chalk.blue(`See the results here: ${release.html_url}`));

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
    _prepareRelease(block) {
        const releaseOptions = {
            tag_name: block.release,
            name: block.name,
            body: block.body,
            draft: this.options.draft,
            prerelease: this.options.prerelease
        };

        if (block.id) {
            if (!this.options.override) {
                console.warn(chalk.black(chalk.bgYellow(`Skipping ${block.release} (use --override to replace it)`)));

                return Promise.resolve();
            }

            return this._editRelease(block.id, releaseOptions);
        }

        return this._createRelease(releaseOptions);
    }

    /**
     * Get the tags information from the given ones, and adds
     * the next one in case only one is given
     *
     * @since 0.5.0
     * @private
     *
     * @param  {Array|string} allTags
     * @param  {Object[]} tags
     *
     * @return {Boolean|Array}
     */
    _getSelectedTags(allTags) {
        const { tags } = this.options;

        if (tags.indexOf('all') >= 0) {
            return allTags;
        }

        if (!allTags || !allTags.length || !tags.length) {
            return false;
        }

        const selectedTags = [].concat(tags);

        return allTags.filter(({ name }, index) => {
            const isSelectedTag = selectedTags.includes(name);

            if (isSelectedTag && selectedTags.length === 1 && allTags[index + 1]) {
                selectedTags.push(allTags[index + 1].name);
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
    _getLastTags(releases) {
        const loaded = utils.task(this, 'Getting tags');

        return this.repo.listTags()
            .then(response => {
                loaded();

                const tags = response.data;

                if (!tags.length) {
                    throw chalk.red('Looks like you have no tags! Tag a commit first and then run gren again');
                }

                const filteredTags = (this._getSelectedTags(tags) || [tags[0], tags[1]])
                    .filter(Boolean)
                    .map(tag => {
                        const tagRelease = releases ? releases.filter(release => release.tag_name === tag.name)[0] : false;
                        const releaseId = tagRelease ? tagRelease.id : null;

                        return {
                            tag: tag,
                            releaseId: releaseId
                        };
                    });

                console.log('Tags found: ' + filteredTags.map(tag => tag.tag.name).join(', '));

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
    _getTagDates(tags) {
        return tags.map(tag => this.repo.getCommit(tag.tag.commit.sha)
            .then(response => ({
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
    _getListReleases() {
        const loaded = utils.task(this, 'Getting the list of releases');

        return this.repo.listReleases()
            .then(response => {
                loaded();

                const releases = response.data;

                process.stdout.write(releases.length + ' releases found\n');

                return releases;
            });
    }

    /**
     * Generate the releases bodies from a release Objects Array
     *
     * @since 0.8.0
     * @private
     * @ignore
     *
     * @param  {Array} releases The release Objects Array coming from GitHub
     *
     * @return {string}
     */
    _templateReleases(releases) {
        const { template } = this.options;

        return releases.map(release => generate({
            release: release.name,
            date: utils.formatDate(new Date(release.published_at)),
            body: release.body
        }, template.release)).join(template.releaseSeparator);
    }

    /**
     * Return the templated commit message
     *
     * @since 0.1.0
     * @private
     *
     * @param  {Object} commit
     *
     * @return {string}
     */
    _templateCommits({ sha, commit: { author: { name }, message, url } }) {
        return generate({
            sha,
            message: message.split('\n')[0],
            url,
            author: name
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
    _templateLabels(issue) {
        const labels = Array.from(issue.labels);

        if (!labels.length && this.options.template.noLabel) {
            labels.push({name: this.options.template.noLabel});
        }

        return labels
            .filter(label => this.options.ignoreLabels.indexOf(label.name) === -1)
            .map(label => generate({
                label: label.name
            }, this.options.template.label)).join('');
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
    _templateIssue(issue) {
        return generate({
            labels: this._templateLabels(issue),
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
    _templateIssueBody(body, rangeBody) {
        if (Array.isArray(body) && body.length) {
            return body.join('\n') + '\n';
        }

        if (rangeBody) {
            return `${rangeBody}\n`;
        }

        return '*No changelog for this release.*\n';
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
    _templateGroups(groups) {
        return Object.entries(groups).map(([key, value]) => {
            const heading = generate({
                heading: key
            }, this.options.template.group);
            const body = value.join('\n');

            return heading + '\n' + body;
        });
    }

    /**
     * Filter a commit based on the includeMessages option and commit message
     *
     * @since  0.10.0
     * @private
     *
     * @param  {Object} commit
     *
     * @return {Boolean}
     */
    _filterCommit({ commit: { message } }) {
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
    }

    /**
     * Return a commit messages generated body
     *
     * @since 0.1.0
     * @private
     *
     * @param  {Array} commits
     *
     * @return {string}
     */
    _generateCommitsBody(commits = []) {
        const bodyMessages = Array.from(commits);

        if (bodyMessages.length === 1) {
            bodyMessages.push(null);
        }

        return bodyMessages
            .slice(0, -1)
            .filter(this._filterCommit.bind(this))
            .map(this._templateCommits.bind(this))
            .join('\n');
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
    _getCommitsBetweenTwo(since, until) {
        process.stdout.write(chalk.green('Get commits between ' + utils.formatDate(new Date(since)) + ' and ' + utils.formatDate(new Date(until)) + '\n'));

        const options = {
            since: since,
            until: until,
            per_page: 100
        };

        return this.repo.listCommits(options)
            .then(({ data }) => data);
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
    _getCommitBlocks(releaseRanges) {
        console.log(chalk.blue('\nCreating the body blocks from commits:'));

        return Promise.all(
            releaseRanges
                .map(range => this._getCommitsBetweenTwo(range[1].date, range[0].date)
                    .then(commits => ({
                        id: range[0].id,
                        name: this.options.prefix + range[0].name,
                        release: range[0].name,
                        published_at: range[0].date,
                        body: this._generateCommitsBody(commits) + '\n'
                    })))
        );
    }

    /**
     * Compare the ignored labels with the passed ones
     *
     * @since 0.10.0
     * @private
     *
     * @param  {Array} labels   The labels to check
     * @example [{
     *     name: 'bug'
     * }]
     *
     * @return {boolean}    If the labels array contains any of the ignore ones
     */
    _lablesAreIgnored(labels) {
        if (!labels || !Array.isArray(labels)) {
            return false;
        }

        const { ignoreIssuesWith } = this.options;

        return ignoreIssuesWith.some(label => labels.map(({ name }) => name).includes(label));
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
    _getClosedIssues(releaseRanges) {
        const loaded = utils.task(this, 'Getting all closed issues');

        return this.issues.listIssues({
            state: 'closed',
            since: releaseRanges[releaseRanges.length - 1][1].date
        })
            .then(({ data }) => {
                loaded();

                return data;
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
    _groupByLabel(issues) {
        const groups = [];

        issues.forEach(issue => {
            if (!issue.labels.length && this.options.template.noLabel) {
                issue.labels.push({name: this.options.template.noLabel});
            }

            const labelName = issue.labels[0].name;

            if (!groups[labelName]) {
                groups[labelName] = [];
            }

            groups[labelName].push(this._templateIssue(issue));
        });

        return this._templateGroups(utils.sortObject(groups));
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
    _groupBy(issues) {
        const { groupBy } = this.options;

        if (!groupBy) {
            return issues.map(this._templateIssue.bind(this));
        }

        if (groupBy === 'label') {
            return this._groupByLabel(issues);
        }

        if (typeof groupBy !== 'object') {
            throw chalk.red('The option for groupBy is invalid, please check the documentation');
        }

        const allLabels = Object.values(groupBy).reduce((carry, group) => carry.concat(group), []);

        const groups = Object.keys(groupBy).reduce((carry, group) => {
            const groupIssues = Array.from(issues).filter(issue => {
                if (!issue.labels.length && this.options.template.noLabel) {
                    issue.labels.push({name: this.options.template.noLabel});
                }

                return issue.labels.some(label => {
                    const isOtherLabel = groupBy[group].indexOf('...') !== -1 && allLabels.indexOf(label.name) === -1;

                    return groupBy[group].indexOf(label.name) !== -1 || isOtherLabel;
                });
            }).map(this._templateIssue.bind(this));

            if (groupIssues.length) {
                carry[group] = groupIssues;
            }

            return carry;
        }, {});

        return this._templateGroups(groups);
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
    _filterIssue(issue) {
        return !issue.pull_request && !this._lablesAreIgnored(issue.labels) &&
            !((this.options.onlyMilestones || this.options.dataSource === 'milestones') && !issue.milestone);
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
    _filterBlockIssue(range, issue) {
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
    _getIssueBlocks(releaseRanges) {
        console.log('Creating the body blocks from releases:');

        return this._getClosedIssues(releaseRanges)
            .then(issues => releaseRanges
                .map(range => {
                    const filteredIssues = issues
                        .filter(this._filterIssue.bind(this))
                        .filter(this._filterBlockIssue.bind(this, range));
                    const body = (!range[0].body || this.options.override) && this._groupBy(filteredIssues);

                    process.stdout.write(filteredIssues.length + ' issues found\n');

                    return {
                        id: range[0].id,
                        release: range[0].name,
                        name: this.options.prefix + range[0].name,
                        published_at: range[0].date,
                        body: this._templateIssueBody(body, range[0].body)
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
    _sortReleasesByDate(releaseDates) {
        return Array.from(releaseDates).sort((release1, release2) => new Date(release2.date) - new Date(release1.date));
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
    _createReleaseRanges(releaseDates) {
        const ranges = [];
        const range = 2;
        const sortedReleaseDates = this._sortReleasesByDate(releaseDates);

        if (sortedReleaseDates.length === 1 || this.options.tags === 'all') {
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
    _getReleaseBlocks() {
        let loaded;
        const dataSource = {
            issues: this._getIssueBlocks.bind(this),
            commits: this._getCommitBlocks.bind(this),
            milestones: this._getIssueBlocks.bind(this)
        };

        return this._getListReleases()
            .then(releases => this._getLastTags(releases.length ? releases : false))
            .then(tags => {
                loaded = utils.task(this, 'Getting the tag dates ranges');

                return Promise.all(this._getTagDates(tags));
            })
            .then(releaseDates => {
                loaded();

                return dataSource[this.options.dataSource](
                    this._createReleaseRanges(releaseDates)
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

                resolve(isOnline);
            });
        });
    }
}

export default Gren;
