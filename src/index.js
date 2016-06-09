'use strict';

var utils = require('./utils');
var githubInfo = require('./github-info');
var Github = require('github-api');
var fs = require('fs');
var chalk = require('chalk');
var Promise = Promise || require('es6-promise').Promise;

var defaults = {
   timeWrap: 'latest', // || history
   changelogFilename: 'CHANGELOG.md',
   dataSource: 'issues', // || commits
   draft: false,
   force: false,
   prefix: '',
   prerelease: false,
   timeMeter: 'releaseDates', // || milestones,
   dateZero: new Date(0)
};

/**
 * Create a release from a given tag (in the options)
 *
 * @since 0.1.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 * @param  {Object} releaseOptions The options to build the release:
 * {
 *   "tag_name": "v1.0.0",
 *   "target_commitish": "master",
 *   "name": "v1.0.0",
 *   "body": "Description of the release",
 *   "draft": false,
 *   "prerelease": false
 * }
 */
function createRelease(gren, releaseOptions) {
   var loaded = utils.task('Preparing the release');

   return new Promise(function (resolve, reject) {
      gren.repo.createRelease(releaseOptions, function (err, release) {
         loaded();

         if(err) {
            var responseText = JSON.parse(err.request.responseText);
            console.log(chalk.red(
               responseText.message + '\n' +
               responseText.errors[0].code
            ));
            reject(false);
         } else {            
            console.log(chalk.green('\n\n' + release.name + ' has successfully created!'));

            resolve(true);
         }
      });
   });
}

/**
 * Creates the options to make the release
 *
 * @since 0.2.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 * @param  {Object[]} tags The collection of tags
 */
function prepareRelease(gren, block) {
   var releaseOptions = {
      tag_name: block.release,
      name: gren.options.prefix + block.release,
      body: block.body,
      draft: gren.options.draft,
      prerelease: gren.options.prerelease
   };

   return createRelease(gren, releaseOptions);
}

/**
 * Transforms the commits to commit messages
 *
 * @since 0.1.0
 * 
 * @param  {Object[]} commits The array of object containing the commits
 *
 * @return {String[]}
 */
function commitMessages(commits) {
   return commits.map(function (commitObject) {
      return commitObject.commit.message;
   });
}

/**
 * Gets all the commits between two dates
 *
 * @since 0.1.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 * @param  {string} since The since date in ISO
 * @param  {string} until The until date in ISO
 *
 * @return {Promise}      The promise which resolves the [Array] commit messages
 */
function getCommitsBetweenTwo(gren, since, until) {
   var loaded = utils.task('Get commits between ' + utils.formatDate(new Date(since)) + ' and ' + utils.formatDate(new Date(until)));

   var options = {
      since: since,
      until: until,
      per_page: 100
   };

   return new Promise(function (resolve, reject) {
      gren.repo.listCommits(options, function (err, commits) {
         loaded();

         if(err) {
            reject(err);
         } else {
            resolve(commitMessages(commits));
         }
      });
   });
}

/**
 * Get all the tags of the repo
 *
 * @since 0.1.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 *
 * @return {Promise}
 */
function getLastTags(gren, releaseTagName) {
   var loaded = utils.task('Getting latest tag');

   return new Promise(function (resolve, reject) {
      gren.repo.listTags(function (err, tags) {
         loaded();
         
         if(err) {
            reject(err);
         } else {
            var filteredTags = tags.filter(function(tag, index) {
               return index === 0 || (releaseTagName ? tag.name === releaseTagName : index === tags.length-1);
            });

            resolve(filteredTags);
         }
      });
   });
}

/**
 * Get the dates of the last two tags
 *
 * @since 0.1.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 * @param  {Object[]} tags List of all the tags in the repo
 *
 * @return {Promise[]}     The promises which returns the dates
 */
function getTagDates(gren, tags) {
   var loaded = utils.task('Getting the tag dates ranges');

   return tags.map(function (tag) {
      return new Promise(function (resolve, reject) {
         gren.repo.getCommit(tag.commit.sha, function (err, commit) {
            loaded();

            if(err) {
               reject(err);
            } else {
               resolve({
                  name: tag.name,
                  date: commit.committer.date
               });
            }
         });
      });
   });
}

/**
 * Get all releases
 *
 * @since 0.5.0
 * 
 * @param  {Object[]} releases A list of release Objects
 *
 * @return {Array} The list of the dates
 */
function getReleaseDates(gren, releases) {
   return [].concat(releases).map(function (release) {
      return {
         id: release.id,
         name: release.name,
         tag_name: release.tag_name,
         date: release.created_at,
         body: release.body || null
      };
   }).concat(releases.length === 1 || gren.options.timeWrap === 'history' && {id: 0, date: gren.options.dateZero} || []);
}

/**
 * Get all releases
 *
 * @since 0.5.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 *
 * @return {Promise} The promise which resolves an array of releases
 */
function getListReleases(gren) {
   var loaded = utils.task('Getting the list of releases');

   return new Promise(function (resolve, reject) {
      gren.repo.listReleases(function (err, releases) {
         loaded();

         if(err && err.request.status !== 404) {            
            reject(err);
         } else {
            if(err && err.request.status === 404) {
               resolve(false);
            } else {
               process.stdout.write(releases.length + ' releases found\n');
               resolve(releases);
            }
         }
      });
   });
}

/**
 * Get the latest two releases
 *
 * @since 0.5.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 *
 * @return {Promise} The promise which resolves the tag name of the release
 */
function getLatestTwoRelease(gren) {
   return getListReleases(gren)
      .then(function(releases) {
         return releases.slice(0, 2);
      });
}

/**
 * Get the latest release
 *
 * @since 0.5.0
 *
 * @param  {GithubReleaseNotes} gren The gren object
 *
 * @return {Promise} The promise which resolves the tag name of the release
 */
function getLatestRelease(gren) {
   return getListReleases(gren)
      .then(function(releases) {
         return releases[0];
      });
}

/**
 * Return a string with a - to be a bullet list (used for a mapping)
 *
 * @since 0.1.0
 * 
 * @param  {string} message
 *
 * @return {string}
 */
function templateCommits(message) {
   return '- ' + message;
}

/**
 * Generate the MD template from all the labels of a specific issue
 *
 * @since 0.5.0
 * 
 * @param  {Object} issue
 * 
 * @return {string}
 */
function templateLabels(issue) {
   return issue.labels ? issue.labels.map(function (label) {
      return '[**' + label.name + '**] ';
   })
   .join('') : '[closed]';
}

/**
 * Generate the MD template a block
 *
 * @since 0.5.0
 * 
 * @param  {Object} block ({name: 'v1.2.3', body: []})
 * 
 * @return {string}
 */
function templateBlock(block) {
   var date = new Date(block.date);

   return '## ' + block.release + ' (' + utils.formatDate(date) + ')' + '\n\n' +
          block.body;
}

/**
 * Generate the MD template for each issue
 *
 * @since 0.5.0
 * 
 * @param  {Object} issue
 * 
 * @return {string}
 */
function templateIssue(issue) {
   return '- ' + templateLabels(issue) + issue.title + ' [#' + issue.number + '](' + issue.html_url + ')';
}

/**
 * Generate the Changelog MD template
 *
 * @since 0.5.0
 * 
 * @param  {Object[]} blocks
 * 
 * @return {string}
 */
function templateChangelog(blocks) {
   return '# Changelog\n\n' +
          blocks
            .map(templateBlock)
            .join('\n\n --- \n\n');
}

/**
 * Return a commit messages generated body 
 *
 * @since 0.5.0
 * 
 * @param  {string} message
 *
 * @return {string}
 */
function generateCommitsBody(gren, messages) {
   return messages
      .slice(0, -1)
      .filter(function (message) {
         var messageType = gren.options.includeMessages;
         var filterMap = {
            merges: function(message) {
               return message.match(/^merge/i);
            },
            commits: function(message) {
               return !message.match(/^merge/i);
            },
            all: function() { return true; }
         };

          if(filterMap[messageType]) {
            return filterMap[messageType](message);
          }

          return filterMap.commits(message);
      })
      .map(templateCommits)
      .join('\n');
}

/**
 * Get the list of all the issues of a specific milestone
 *
 * @since 0.5.0
 * 
 * @param  {Object[]} issues  The list of all the issues
 * @param  {Object} milestone The milestone whom filter the issues
 * 
 * @return {string}
 */
function getMilestoneIssues(issues, milestone) {
   return issues.filter(function(issue) {
      return issue.milestone !== null && issue.milestone.id === milestone.id;
   })
   .map(templateIssue)
   .join('\n');
}

/**
 * Get all the closed issues from the current repo
 *
 * @since 0.5.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 * 
 * @return {Promise} The promise which resolves the list of the issues
 */
function getClosedIssues(gren) {
   var loaded = utils.task('Getting all closed issues');

   return new Promise(function (resolve, reject) {
      gren.issues.listIssues({
         state: 'closed'
      }, function (err, issues) {
         loaded();

         if(err) {
            reject(err);
         } else {
            var filteredIssues = issues.filter(function (issue) {
               return !issue.pull_request;
            });

            process.stdout.write(filteredIssues.length + ' issues found');

            resolve(filteredIssues);
         }
      });
   });
}

/**
 * Get all the closed milestones from the current repo
 *
 * @since 0.5.0
 * 
 * @param  {GithubReleaseNotes} gren The gren object
 * 
 * @return {Promise} The promise which resolves the list of the milestones
 */
function getClosedMilestones(gren) {
   return new Promise(function (resolve, reject) {
      gren.issues.listMilestones({ state: 'closed' }, function (err, milestones) {
         if(err) {
            reject(err);
         } else {
            resolve(milestones);
         }
      });
   });
}

/**
 * Get the blocks of issues based on release dates
 * 
 * @since 0.5.0
 * 
 * @param  {GithubReleaseNotes} gren
 * @param  {Array} releaseRanges The array of date ranges
 * 
 * @return {Promise[]}
 */
function getIssueBlocks(gren, releaseRanges) {
   console.log('\nCreating the body blocks from issues:');

   return getClosedIssues(gren)
      .then(function (issues) {
         return releaseRanges
                  .map(function (range) {
                     var body = (!range[0].body || gren.options.force) &&
                        issues.filter(function (issue) {
                           return utils.isInRange(
                              Date.parse(issue.closed_at),
                              Date.parse(range[1].date),
                              Date.parse(range[0].date)
                           );
                        })
                        .map(templateIssue)
                        .join('\n') || range[0].body + '\n';

                     return {
                        release: range[0].name,
                        date: range[0].date,
                        body: body
                     };
                  });
      });
}

/**
 * Get the blocks of commits based on release dates
 *
 * @since 0.5.0
 * 
 * @param  {GithubReleaseNotes} gren
 * @param  {Array} releaseRanges The array of date ranges
 * 
 * @return {Promise[]}
 */
function getCommitBlocks(gren, releaseRanges) {
   console.log('\nCreating the body blocks from commits:');

   return Promise.all(
      releaseRanges
         .map(function (range) {
            return getCommitsBetweenTwo(gren, range[1].date, range[0].date)
               .then(function (commits) {
                  return {
                     release: range[0].name,
                     date: range[0].date,
                     body: generateCommitsBody(gren, commits)
                  };
               });
         })
   );
}

/**
 * Create the ranges of release dates
 *
 * @since 0.5.0
 * 
 * @param  {Array} releaseDates The release dates
 * 
 * @return {Array}
 */
function createReleaseRanges(releaseDates) {
   var ranges = [];
   var range = 2;

   for(var i = 0; i<releaseDates.length-1; i++) {
      ranges.push(releaseDates.slice(i, i+range));
   }

   return ranges;
}

/**
 * Generate a CHANGELOG.md file based on Time and issues
 *
 * @since 0.5.0
 *
 * @return {Promise[]}
 */
function generateReleaseDatesChangelogBody(gren) {
   var releaseActions = {
      history: getListReleases,
      latest: getLatestTwoRelease
   };
   var dataSource = {
      issues: getIssueBlocks,
      commits: getCommitBlocks
   };

   return releaseActions[gren.options.timeWrap](gren)
      .then(function (releases) {
         var releaseRanges = createReleaseRanges(getReleaseDates(gren, releases));

         return dataSource[gren.options.dataSource](gren, releaseRanges);
      })
      .then(function (blocks) {
         return templateChangelog(blocks);
      });
}

/**
 * Generate a CHANGELOG.md file based on Milestones and issues
 *
 * @since 0.5.0
 * 
 * @return {Promise}
 */
function generateMilestonesChangelogBody(gren) {
   return Promise.all([getClosedMilestones(gren), getClosedIssues(gren)])
      .then(function (data) {
         var milestones = data[0];
         var issues = data[1];

         // @TODO: Sort by date rather than reorder it
         milestones.reverse();

         return milestones.map(function(milestone) {
            var date = new Date(milestone.closed_at);
            var stringDate = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear();

            return {
               title: milestone.title,
               date: stringDate,
               body: getMilestoneIssues(issues, milestone)
            };
         });
      })
      .then(function (milestones) {
         return templateChangelog(milestones);
      })
      .catch(function (error) {
         console.error(error);

         return false;
      });
}

/**
 * Create the CHANGELOG.md file
 *
 * @since 0.5.0
 * 
 * @param  {string} body
 * 
 * @return {boolean}
 */
function createChangelog(gren, body) {
   var stats;

   function createFile(fileBody) {
      fs.writeFile(gren.options.changelogFilename, fileBody, function(err) {
         if(err) {
            throw err;
         }

         process.stdout.write('\n' + chalk.green('The changelog file has been saved!'));

         return true;
      });
   }

   try {
      stats = fs.statSync(gren.options.changelogFilename);

      fs.readFile(gren.options.changelogFilename, 'utf-8', function(err, data) {
         if(err) {
            console.error(chalk.red(err));
            return;
         }

         var newReleaseName = body.match(/(##\s[\w\.]+)/)[0];

         if(data.match(newReleaseName)) {
            console.error(chalk.red('\nThis release is already in the changelog'));

            // @TODO: Change to a dedicated option
            if(gren.options.force) {
               createFile(body);
            }

            return;
         }

         createFile(body + data.replace(/^(#\s?\w*\n\n)/g, ''));
      });

   }
   catch (e) {
      createFile(body);
   }

}

/**
 * Generate the GithubReleaseNotes getting the options from the git config
 *
 * @since 0.5.0
 * 
 * @return {Promise[]}
 */
function generateOptions() {
   return Promise.all([
      githubInfo.user(),
      githubInfo.repo(),
      githubInfo.token()
   ]);
}

/**
 * @param  {Object} [options] The options of the module
 *
 * @since  0.1.0
 *
 * @constructor
 */
function GithubReleaseNotes(options) {
   this.options = Object.assign({}, defaults, options || utils.getOptions(process.argv));
   this.repo = null;
   this.issues = null;
}

/**
 * Initialise the GithubReleaseNotes module, create the options and run
 * a given module method
 *
 * @since 0.5.0
 * 
 * @param  {function} action
 */
GithubReleaseNotes.prototype.init = function(action) {
   var gren = this;

   generateOptions(this.options)
      .then(function (OptionData) {
         gren.options = Object.assign(...OptionData, gren.options);

         if(!gren.options.token) {
            throw chalk.red('You need to provide the token');
         }
         
         var githubApi = new Github({
            token: gren.options.token
         });

         gren.repo = githubApi.getRepo(gren.options.username, gren.options.repo);
         gren.issues = githubApi.getIssues(gren.options.username, gren.options.repo);

         console.log(chalk.green('Hello ' + gren.options.user + ', sit back while I do the ' + action + ' for you\n'));

         gren[action]();

      })
      .catch(function (error) {
         console.log(error);
      });
};

/**
 * Get All the tags, get the dates, get the commits between those dates and prepeare the release
 * 
 * @since  0.1.0
 * 
 * @return {Promise}
 */
GithubReleaseNotes.prototype.release = function() {
   utils.printTask('Release');
   
   var gren = this;
   var dataSource = {
      issues: getIssueBlocks,
      commits: getCommitBlocks
   };


   return getLatestRelease(this)
      .then(function (release) {
         return getLastTags(gren, release.tag_name || false);
      })
      .then(function (tags) {
         if(tags.length === 1) {
            throw chalk.red('The latest tag is the latest release!');
         }

         return Promise.all(getTagDates(gren, tags));
      })
      .then(function (releaseDates) {
         return dataSource[gren.options.dataSource](gren, createReleaseRanges(releaseDates));
      })
      .then(function (blocks) {
         return prepareRelease(gren, blocks[0]);
      })
      .then(function (success) {
         return success && gren.changelog();
      })
      .then(function (success) {
         return success;
      })
      .catch(function (error) {
         console.error(error);

         if(gren.options.force) {
            gren.changelog();
         }

         return gren.options.force;
      });
   
};

/**
 * Generate the Changelog based on milestones
 *
 * @since 0.5.0
 * 
 * @param {string} type The type of changelog
 */
GithubReleaseNotes.prototype.changelog = function() {
   utils.printTask('\nChangelog');
 
   var gren = this;
   var changelogs = {
      releaseDates: generateReleaseDatesChangelogBody,
      milestones: generateMilestonesChangelogBody
   };
   var changelogFunction = changelogs[this.options.timeMeter];

   return changelogFunction(this)
      .then(function(changelogBody) {
         return createChangelog(gren, changelogBody);
      }).
      then(function (success) {
         return success;
      })
      .catch(function (error) {
         console.error(error);

         return gren.options.force;
      });
};

module.exports = GithubReleaseNotes;