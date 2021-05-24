import chalk from 'chalk';
import Github from 'github-api';
import utils from './_utils.js';
import { generate } from './_template.js';
import connectivity from 'connectivity';
import templateConfig from './templates.js';
import ObjectAssign from 'object-assign-deep';
import fs from 'fs';

const defaults = {
    tags: [],
    prefix: '',
    template: templateConfig,
    prerelease: false,
    generate: false,
    quiet: false,
    override: false,
    debug: false,
    ignoreLabels: false,
    ignoreIssuesWith: false,
    ignoreCommitsWith: false,
    groupBy: false,
    milestoneMatch: 'Release {{tag_name}}'
};

const MAX_TAGS_LIMIT = 99;
const TAGS_LIMIT = 30;

/** Class creating release notes and changelog notes */
class Gren {
    constructor(props = {}) {
        this.options = ObjectAssign({}, defaults, props);
        this.tasks = [];

        const {
            username,
            repo,
            token,
            apiUrl,
            tags,
            limit,
            ignoreLabels,
            ignoreIssuesWith,
            ignoreCommitsWith,
            ignoreTagsWith
        } = this.options;

        this.options.tags = utils.convertStringToArray(tags);
        this.options.ignoreLabels = utils.convertStringToArray(ignoreLabels);
        this.options.ignoreIssuesWith = utils.convertStringToArray(ignoreIssuesWith);
        this.options.ignoreCommitsWith = utils.convertStringToArray(ignoreCommitsWith);
        this.options.ignoreTagsWith = utils.convertStringToArray(ignoreTagsWith);

        if (limit && limit > 0 && limit <= MAX_TAGS_LIMIT) {
            this.options.limit = limit;
        } else if (this.options.tags.indexOf('all') >= 0) {
            this.options.limit = MAX_TAGS_LIMIT;
        } else {
            this.options.limit = TAGS_LIMIT;
        }

        if (!token) {
            throw chalk.red('You must provide the TOKEN');
        }

        if (this.options.debug) {
            this._outputOptions(this.options);
        }

        this.githubApi = new Github({
            token
        }, apiUrl);

        this.repo = this.githubApi.getRepo(username, repo);
        this.issues = this.githubApi.getIssues(username, repo);
    }

    /**
     * Generate release notes and draft a new release
     *
     * @since  0.10.0
     * @public
     *
     * @return {Promise}
     */
    async release() {
        utils.printTask(this.options.quiet, 'Generate release notes');

        await this._hasNetwork();
        const blocks = await this._getReleaseBlocks();

        return blocks.reduce((carry, block) => carry.then(this._prepareRelease.bind(this, block)), Promise.resolve());
    }

    /**
     * Generate changelog file based on the release notes or generate new one
     *
     * @since  0.10.0
     * @public
     *
     * @return {Promise}
     */
    async changelog() {
        utils.printTask(this.options.quiet, 'Generate changelog file');

        await this._hasNetwork();
        this._checkChangelogFile();

        const releases = this.options.generate ? await this._getReleaseBlocks() : await this._getListReleases();

        if (releases.length === 0) {
            throw chalk.red('There are no releases, use --generate to create release notes, or run the release command.');
        }

        return this._createChangelog(this._templateReleases(releases));
    }

    /**
     * Check if the changelog file exists
     *
     * @since 0.8.0
     * @private
     *
     * @return {string}
     */
    _checkChangelogFile() {
        const filePath = process.cwd() + '/' + this.options.changelogFilename;

        if (fs.existsSync(filePath) && !this.options.override) {
            throw chalk.black(chalk.bgYellow('Looks like there is already a changelog, to override it use --override'));
        }

        return filePath;
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
        const loaded = utils.task(this, `Creating ${this.options.changelogFilename}`);
        const filePath = process.cwd() + '/' + this.options.changelogFilename;

        fs.writeFileSync(filePath, this.options.template.changelogTitle + body);

        loaded(chalk.green(`Changelog created in ${filePath}`));
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
    async _editRelease(releaseId, releaseOptions) {
        const loaded = utils.task(this, 'Updating latest release');
        const { data: release } = await this.repo.updateRelease(releaseId, releaseOptions);

        loaded(chalk.green(`${release.name} has been successfully updated!`) + chalk.blue(`\nSee the results here: ${release.html_url}`));

        return release;
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
    async _createRelease(releaseOptions) {
        const loaded = utils.task(this, 'Preparing the release');
        const { data: release } = await this.repo.createRelease(releaseOptions);

        loaded(chalk.green(`${release.name} has been successfully created!`) + chalk.blue(`\nSee the results here: ${release.html_url}`));

        return release;
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
     * Temporary function for this.repo.listReleases to accept options
     *
     * @see  https://github.com/github-tools/github/pull/485
     * @param  {Object} options
     *
     * @return {Promise}
     */
    _listTags(options) {
        return this.repo._request('GET', `/repos/${this.repo.__fullname}/tags`, options);
    }

    /**
     * Get all the tags of the repo
     *
     * @since 0.1.0
     * @private
     * @deprecated
     *
     * @param {Array} releases
     * @param {number} page
     *
     * @return {Promise}
     */
    async _getLastTags(releases, page = 1, limit = this.options.limit) {
        const { headers: { link }, data: tags } = await this._listTags({
            per_page: limit,
            page
        });

        if (!tags.length) {
            throw chalk.red('\nLooks like you have no tags! Tag a commit first and then run gren again');
        }

        const filteredTags = (this._getSelectedTags(tags) || [tags[0], tags[1]])
            .filter(Boolean)
            .filter(({ name }) => this.options.ignoreTagsWith.every(ignoreTag => !name.match(ignoreTag)))
            .map(tag => {
                const tagRelease = releases ? releases.filter(release => release.tag_name === tag.name)[0] : false;
                const releaseId = tagRelease ? tagRelease.id : null;

                return {
                    tag: tag,
                    releaseId: releaseId
                };
            });
        const totalPages = this._getLastPage(link);

        if ((this.options.tags.indexOf('all') >= 0 || filteredTags.length < 2) && totalPages && +page < totalPages) {
            return this._getLastTags(releases, page + 1).then(moreTags => moreTags.concat(filteredTags));
        }

        return filteredTags;
    }

    /**
     * Get all the tags of the repo
     *
     * @since 0.1.0
     * @private
     * @deprecated
     *
     * @param {Array} releases
     * @param {number} page
     *
     * @return {Promise}
     */
    async _getAllTags(releases, page = 1, limit = this.options.limit) {
        const { headers: { link }, data: tags } = await this._listTags({
            per_page: limit,
            page
        });

        if (!tags.length) {
            throw chalk.red('\nLooks like you have no tags! Tag a commit first and then run gren again');
        }

        const filteredTags = tags
            .filter((tag) => tag && this.options.ignoreTagsWith.every(ignoreTag => !tag.name.match(ignoreTag)))
            .map(tag => {
                const tagRelease = releases ? releases.filter(release => release.tag_name === tag.name)[0] : false;

                const releaseId = tagRelease ? tagRelease.id : null;
                const releaseDate = tagRelease ? tagRelease.published_at : null;

                return {
                    tag: tag,
                    releaseId: releaseId,
                    date: releaseDate
                };
            });

        const totalPages = this._getLastPage(link);

        if (totalPages && page < totalPages) {
            return this._getAllTags(releases, page + 1).then(moreTags => moreTags.concat(filteredTags));
        }

        return filteredTags;
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
        return tags.map(async tag => {
            const { data: { committer } } = await this.repo.getCommit(tag.tag.commit.sha);

            return {
                id: tag.releaseId,
                name: tag.tag.name,
                date: committer.date
            };
        });
    }

    /**
     * Temporary function for this.repo.listReleases to accept options
     *
     * @see  https://github.com/github-tools/github/pull/485
     * @param  {Object} options
     *
     * @return {Promise}
     */
    _listReleases(options) {
        return this.repo._request('GET', `/repos/${this.repo.__fullname}/releases`, options);
    }

    /**
     * Get the merged pull requests from the repo
     *
     * @private
     *
     * @param {number} page
     * @param {number} limit
     *
     * @return {Promise[]}     The promises which returns pull requests
     */
    async _getMergedPullRequests(since, page = 1, limit = 1000) {
        const results = await this.repo.listPullRequests({
            state: 'closed',
            sort: 'updated',
            direction: 'desc',
            per_page: limit,
            page
        });

        const { headers: { link }, data: prs } = results;
        const totalPages = this._getLastPage(link);
        const filterPrs = prs.filter(pr => pr.merged_at);
        if (prs.length > 0 && since < (new Date(prs[prs.length - 1].updated_at)) &&
            totalPages && +page < totalPages) {
            return this._getMergedPullRequests(since, page + 1).then(prsResults => prsResults.concat(filterPrs));
        }

        return filterPrs;
    }

    /**
     * Get the last page from a Hypermedia link
     *
     * @since  0.11.1
     * @private
     *
     * @param  {string} link
     *
     * @return {boolean|number}
     */
    _getLastPage(link) {
        const linkMatch = Boolean(link) && link.match(/page=(\d+)>; rel="last"/);

        return linkMatch && +linkMatch[1];
    }

    /**
     * Get all releases
     *
     * @since 0.5.0
     * @private
     *
     * @return {Promise} The promise which resolves an array of releases
     */
    async _getListReleases(page = 1, limit = this.options.limit) {
        const loaded = utils.task(this, 'Getting the list of releases');
        const { headers: { link }, data: releases } = await this._listReleases({
            per_page: limit,
            page
        });

        const totalPages = this._getLastPage(link);

        if (this.options.tags.indexOf('all') >= 0 && totalPages && +page < totalPages) {
            return this._getListReleases(page + 1).then(moreReleases => moreReleases.concat(releases));
        }

        loaded(`Releases found: ${releases.length}`);

        return releases;
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
            release: release.name || release.tag_name,
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
    // eslint-disable-next-line camelcase
    _templateCommits({ sha, html_url, author, commit: { author: { name }, message } }) {
        return generate({
            sha,
            message: message.split('\n')[0],
            url: html_url,
            author: author && author.login,
            authorName: name
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
            labels.push({ name: this.options.template.noLabel });
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
            url: issue.html_url,
            body: issue.body,
            pr_base: issue.base && issue.base.ref,
            pr_head: issue.head && issue.head.ref,
            user_login: issue.user.login,
            user_url: issue.user.html_url
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
    _templateBody(body, rangeBody) {
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
        const { groupPostProcessor } = this.options;

        return Object.entries(groups).map(([key, value]) => {
            const heading = generate({
                heading: key
            }, this.options.template.group);
            const body = value.join('\n');
            const content = heading + '\n' + body;

            return groupPostProcessor ? groupPostProcessor(content) : content;
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
            merges: message => message.match(/^merge/i),
            commits: message => !message.match(/^merge/i),
            all: () => true
        };
        const shouldIgnoreMessage = this.options.ignoreCommitsWith.every(commitMessage => {
            const regex = new RegExp(commitMessage, 'i');
            return !message.split('\n')[0].match(regex);
        });

        if (filterMap[messageType]) {
            return filterMap[messageType](message) && shouldIgnoreMessage;
        }

        return filterMap.commits(message) && shouldIgnoreMessage;
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
    _generateCommitsBody(commits = [], addEmptyCommit) {
        const bodyMessages = Array.from(commits);

        if (bodyMessages.length === 1 || addEmptyCommit) {
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
    async _getCommitsBetweenTwo(since, until) {
        const options = {
            since: since,
            until: until,
            per_page: 100
        };

        const { data } = await this.repo.listCommits(options);

        return data;
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
    async _getCommitBlocks(releaseRanges) {
        const taskName = 'Creating the body blocks from commits';
        const loaded = utils.task(this, taskName);

        const ranges = await Promise.all(
            releaseRanges
                .map(async range => {
                    const [{ date: until }, { date: since }] = range;

                    this.tasks[taskName].text = `Get commits between ${utils.formatDate(new Date(since))} and ${utils.formatDate(new Date(until))}`;
                    const commits = await this._getCommitsBetweenTwo(since, until);

                    return {
                        id: range[0].id,
                        name: this.options.prefix + range[0].name,
                        release: range[0].name,
                        published_at: range[0].date,
                        body: this._generateCommitsBody(commits, range[1].id === 0) + '\n'
                    };
                })
        );

        loaded(`Commit ranges loaded: ${ranges.length}`);

        return ranges;
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
    async _getClosedIssues(releaseRanges) {
        const type = {
            issues: 'Issues',
            milestones: 'Issues'
        }[this.options.dataSource];
        const loaded = utils.task(this, `Getting all closed ${type}`);
        const { data: issues } = await this.issues.listIssues({
            state: 'closed',
            since: releaseRanges[releaseRanges.length - 1][1].date
        });

        loaded(`${type} found: ${issues.length}`);

        return issues;
    }

    async _getSingleIssue({ user, repo, number }) {
        const loaded = utils.task(this, `Getting single ${number} issue data`);
        const { data: issue } = await this.githubApi.getIssues(user, repo).getIssue(number);
        loaded(`Issue details found: ${issue.number} ${issue.title}`);
        return issue;
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

        Object.values(ObjectAssign({}, issues)).forEach(issue => {
            if (!issue.labels.length) {
                if (!this.options.template.noLabel) {
                    return;
                }

                issue.labels.push({ name: this.options.template.noLabel });
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
    _groupBy(passedIssues) {
        const { groupBy } = this.options;
        const issues = Object.values(ObjectAssign({}, passedIssues));

        if (!groupBy || groupBy === 'false') {
            return issues.map(this._templateIssue.bind(this));
        }

        if (groupBy === 'label') {
            return this._groupByLabel(issues);
        }

        if (typeof groupBy !== 'object' || Array.isArray(groupBy)) {
            throw chalk.red('The option for groupBy is invalid, please check the documentation');
        }

        const allLabels = Object.values(groupBy).reduce((carry, group) => carry.concat(group), []);
        const groups = Object.keys(groupBy).reduce((carry, group, i, arr) => {
            const groupIssues = issues.filter(issue => {
                if (!issue.labels.length && this.options.template.noLabel) {
                    issue.labels.push({ name: this.options.template.noLabel });
                }

                return issue.labels.some(label => {
                    const isOtherLabel = groupBy[group].indexOf('...') !== -1 && allLabels.indexOf(label.name) === -1;

                    return groupBy[group].indexOf(label.name) !== -1 || isOtherLabel;
                }) && !arr.filter(title => carry[title]).some(title => carry[title].indexOf(this._templateIssue(issue)) !== -1);
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
        const { dataSource } = this.options;

        return (issue.pull_request ? dataSource === 'prs' : dataSource === 'issues' | dataSource === 'milestones') && !this._lablesAreIgnored(issue.labels) &&
            !((this.options.onlyMilestones || dataSource === 'milestones') && !issue.milestone);
    }

    /**
     * Filter the pull request based on gren options and labels
     * @private
     *
     * @param  {Object} pullRequest
     *
     * @return {Boolean}
     */
    _filterPullRequest(pullRequest) {
        return !this._lablesAreIgnored(pullRequest.labels) && !(this.options.onlyMilestones && !pullRequest.milestone);
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
     * Filter the pull requests in case the release is milestone,
     * or otherwise by dates range.
     *
     * @private
     *
     * @param  {Array} range The release ranges
     * @param  {Object} pullRequest GitHub pull request
     *
     * @return {Boolean}
     */
    _filterBlockPullRequest(range, pullRequest) {
        if (this.options.dataSource === 'milestones') {
            return this.options.milestoneMatch.replace('{{tag_name}}', range[0].name) === pullRequest.milestone.title;
        }

        return utils.isInRange(
            Date.parse(pullRequest.closed_at),
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
    async _getIssueBlocks(releaseRanges) {
        const issues = await this._getClosedIssues(releaseRanges);
        const release = releaseRanges
            .map(range => {
                const filteredIssues = Array.from(issues)
                    .filter(this._filterIssue.bind(this))
                    .filter(this._filterBlockIssue.bind(this, range));
                const body = (!range[0].body || this.options.override) && this._groupBy(filteredIssues);
                return {
                    id: range[0].id,
                    release: range[0].name,
                    name: this.options.prefix + range[0].name,
                    published_at: range[0].date,
                    body: this._templateBody(body, range[0].body)
                };
            });

        return release;
    }
    /**
     * Get the blocks of pull requests based on the release dates
     *
     * @private
     *
     * @param  {Array} releaseRanges The array of date ranges
     *
     * @return {Promise[]}
     */
    async _getPullRequestsBlocks(releaseRanges) {
        const loaded = utils.task(this, `Getting all merged pull requests`);
        const since = releaseRanges[releaseRanges.length - 1][1].date;
        const prs = await this._getMergedPullRequests(since);

        let totalPrs = 0;
        const release = releaseRanges
            .map(range => {
                const filteredPullRequests = Array.from(prs)
                    .filter(this._filterPullRequest.bind(this))
                    .filter(this._filterBlockPullRequest.bind(this, range));
                totalPrs += filteredPullRequests.length;
                const body = (!range[0].body || this.options.override) && this._groupBy(filteredPullRequests);
                return {
                    id: range[0].id,
                    release: range[0].name,
                    name: this.options.prefix + range[0].name,
                    published_at: range[0].date,
                    body: this._templateBody(body, range[0].body)
                };
            });
        loaded(`Pull Requests found: ${totalPrs}`);
        return release;
    }

    async _getPullRequestWithIssueBlocks(releaseRanges) {
        const loaded = utils.task(this, `Getting all merged pull requests`);
        const since = releaseRanges[releaseRanges.length - 1][1].date;
        let relevantIssues = [];

        const re = new RegExp(`([\\w-]+)/([\\w-]+)/issues/([0-9]+)`, 'gi');

        const prs = (await this._getMergedPullRequests(since))
            .filter(this._filterPullRequest.bind(this))
            .map(pr => {
                const matches = pr.body.match(re);
                const relatedIssues = matches && matches.map(issue => {
                    const [user, repo, , number] = issue.split('/');
                    return { user, repo, number };
                });
                return Object.assign({}, pr, { relatedIssues });
            });

        const release = releaseRanges
            .map(range => {
                const list = prs.filter(this._filterBlockPullRequest.bind(this, range));
                list.forEach(({ relatedIssues }) => { relevantIssues = relevantIssues.concat(relatedIssues || []); });
                loaded(`Pull Requests found: ${list.length}`);
                return Object.assign({}, range, { list });
            });

        const issuesDetails = (await Promise.all(relevantIssues.map(this._getSingleIssue.bind(this))))
            .reduce((acc, el) => { acc[el.number] = el; return acc; }, {});

        return release
            .map(range => {
                const list = range.list.map(el => el.relatedIssues && el.relatedIssues.length ? el.relatedIssues.map(({ number }) => issuesDetails[number]) : [el]);
                return Object.assign({}, range, { list: [].concat(...list) });
            })
            .map(this._render.bind(this));
    }

    _render(range) {
        const body = (!range[0].body || this.options.override) && this._groupBy(range.list);

        return {
            id: range[0].id,
            release: range[0].name,
            name: this.options.prefix + range[0].name,
            published_at: range[0].date,
            body: this._templateBody(body, range[0].body)
        };
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
        const RANGE = 2;
        const sortedReleaseDates = this._sortReleasesByDate(releaseDates);

        if (sortedReleaseDates.length === 1 || this.options.tags.indexOf('all') >= 0) {
            sortedReleaseDates.push({
                id: 0,
                date: new Date(0)
            });
        }

        for (let i = 0; i < sortedReleaseDates.length - RANGE + 1; i++) {
            const until = sortedReleaseDates[i + 1].date;
            ranges.push([
                sortedReleaseDates[i],
                {
                    ...sortedReleaseDates[i + RANGE - 1],
                    date: until
                }
            ]);
        }

        return ranges;
    }

    /**
     * Generate release blocks based on issues or commit messages
     * depending on the option.
     *
     * @return {Promise} Resolving the release blocks
     */
    async _getReleaseBlocks() {
        const loaded = utils.task(this, 'Getting releases');
        const dataSource = {
            issues: this._getIssueBlocks.bind(this),
            commits: this._getCommitBlocks.bind(this),
            milestones: this._getIssueBlocks.bind(this),
            prs: this._getPullRequestsBlocks.bind(this),
            'prs-with-issues': this._getPullRequestWithIssueBlocks.bind(this)
        };
        const releases = await this._getListReleases();
        this.tasks['Getting releases'].text = 'Getting tags';

        const tags = await this._getAllTags(releases.length ? releases : false);

        this._validateRequiredTagsExists(tags, this.options.tags);

        const releaseDates = this._sortReleasesByDate(this._transformTagsIntoReleaseObjects(tags));
        const selectedTags = (this._getSelectedTags(releaseDates) || (releaseDates.length > 1 ? [releaseDates[0], releaseDates[1]] : releaseDates));

        loaded(`Tags found: ${selectedTags.map(({ name }) => name).join(', ')}`);

        return dataSource[this.options.dataSource](
            this._createReleaseRanges(selectedTags)
        );
    }

    _transformTagsIntoReleaseObjects(tags) {
        return tags.map(tag => ({
            id: tag.releaseId,
            name: tag.tag.name,
            date: tag.date
        }));
    }

    /**
     * Check that the require tags exist in tags
     *
     * @param {Array} tags
     * @param {Array} requireTags
     *
     * @throws{Exception} Will throw exception in case that
     * @requireTags were set to 2 specific tags and these tags aren't exists in @tags
     */
    _validateRequiredTagsExists(tags, requireTags) {
        if (requireTags.indexOf('all') >= 0 || !(requireTags instanceof Array)) return;

        const tagsNames = tags.map(tagData => tagData.tag.name);

        const missingTags = requireTags.filter(requireTag => tagsNames.indexOf(requireTag) < 0);
        if (missingTags.length > 0) {
            const inflection = (missingTags.length === 1) ? 'tag is' : 'tags are';
            throw chalk.red(`\nThe following ${inflection} not found in the repository: ${missingTags}. ` +
                'please provide existing tags.');
        }
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

    /**
     * Output the options in the terminal in a formatted way
     *
     * @param  {Object} options
     */
    _outputOptions(options) {
        const camelcaseToSpaces = value => value.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/\w/, a => a.toUpperCase());
        const outputs = Object.entries(options)
            .filter(option => option !== 'debug')
            .map(([key, value]) => `${chalk.yellow(camelcaseToSpaces(key))}: ${value.toString() || 'empty'}`);

        process.stdout.write('\n' + chalk.blue('Options: \n') + outputs.join('\n') + '\n');
    }
}

export default Gren;
