'use strict';

var Github = require('github-api');
var options = getOptions(process.argv);
var token = options.token;
var username = options.username;
var repositoryName = options.repo;
var github = new Github({
  token: token,
  auth: "oauth"
});
var repo = github.getRepo(username, repositoryName);

/**
 * Create a literal object of the node module options
 *
 * @param  {Array} args The array of arguments (the module arguments start from index 2)
 *
 * @return {Object}     The object containg the key/value options
 */
function getOptions(args) {
   var settings = {};

   for(var i=2;i<args.length;i++) {
     settings[args[i].split('=')[0].replace('--', '')] = args[i].split('=')[1];
   }

   return settings;
}

/**
 * Get all the tags of the repo
 *
 * @return {Promise}
 */
function getAllTags() {
   return new Promise(function (resolve, reject) {
      repo.listTags(function(err, tags) {
         if(err) {
            reject(err);
         } else {
            resolve(tags);
         }
      });
   });
}

/**
 * Return a string with a - to be a bullet list (used for a mapping)
 * 
 * @param  {string} message
 * 
 * @return {string}
 */
function createBody(message) {
   return '- ' + message;
}

/**
 * Transforms the commits to commit messages
 * 
 * @param  {[Object]} commits The array of object containing the commits
 * 
 * @return {[string]}
 */
function commitMessages(commits) {
   return commits.map(function (commit) {
      return commit.commit.message;
   });
}

/**
 * Gets all the commits between two dates
 * 
 * @param  {string} since The since date in ISO
 * @param  {string} until The until date in ISO
 * 
 * @return {Promise}      The promise which resolves the commit messages
 */
function getCommitsBetweenTwo(since, until) {
   var options = {
      since: since,
      until: until
   };

   return new Promise(function (resolve, reject) {

      repo.getCommits(options, function (err, commits) {
         if(err) {
            reject(err);
         } else {
            resolve(commitMessages(commits));
         }
      });
   });
}

/**
 * Get the dates of the last two tags
 * 
 * @param  {[Object]} tags List of all the tags in the repo
 * @return {[Promise]}     The promises which returns the dates
 */
function getTagDates(tags) {
   return [tags[0], tags[1]].map(function(tag) {
      return new Promise(function (resolve, reject) {
         repo.getCommit('master', tag.commit.sha, function(err, commit) {
            if(err) {
               reject(err);
            } else {
               resolve(commit.committer.date);
            }
         });
      });
   })
}

/**
 * Create a release from a given tag (in the options)
 * 
 * @param  {Object} options The options to build the release:
 * {
 *   "tag_name": "v1.0.0",
 *   "target_commitish": "master",
 *   "name": "v1.0.0",
 *   "body": "Description of the release",
 *   "draft": false,
 *   "prerelease": false
 * }
 */
function makeRelease(options) {
   repo.makeRelease(options, function (err, release) {
      if(err) {
         console.error(
            (JSON.parse(err.request.responseText)).message + '\n'
            + (JSON.parse(err.request.responseText)).errors[0].code
         );
      } else {
         console.info(release.tag_name + 'successfully created!');
      }
   });
}

/**
 * Creates the options to make the release
 * 
 * @param  {[string]} commitMessages The commit messages to create the release body 
 */
function prepareRelease(commitMessages) {
   var body = commitMessages.filter(function(message) {
      return !message.match('Merge');
   }).map(createBody);

   body.pop();

   var options = {
      tag_name: tags[0].name,
      name: tags[0].name,
      body: body.join('\n'),
      draft: options.draft || false,
      prerelease: options.prerelease || false
   };

   makeRelease(options);
}

/**
 * Get All the tags, get the dates, get the commits between those dates and prepeare the release
 */
function init() {
   getAllTags().then(function(tags) {
      Promise.all(getTagDates(tags))
         .then(function(data) {
            getCommitsBetweenTwo(data[1], data[0]).then(prepareRelease);
         });
   });
}

init();