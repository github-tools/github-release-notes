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

function createBody(message) {
   return '- ' + message;
}

function commitMessages(commits) {
   return commits.map(function (commit) {
      return commit.commit.message;
   });
}

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

getAllTags().then(function(tags) {
   Promise.all(getTagDates(tags))
      .then(function(data) {
         getCommitsBetweenTwo(data[1], data[0]).then(function (commitMessages) {
            var body = commitMessages.filter(function(message) {
               return !message.match('Merge');
            }).map(createBody);

            body.pop();

            var options = {
               tag_name: tags[0].name,
               name: tags[0].name,
               body: body.join('\n')
            };

            makeRelease(options);
         });
      });
});