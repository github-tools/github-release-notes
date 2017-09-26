import { assert } from 'chai';
import GitHubInfo from '../lib/src/GitHubInfo';

describe('GitHubInfo', () => {
    let githubInfo;

    beforeEach(() => {
        githubInfo = new GitHubInfo();
    });

    it('Should execute the commands', done => {
        githubInfo._executeCommand('echo "gren"', text => {
            assert.deepEqual(text, 'gren', 'Returns the text echoed');
        }).then(done);
    });

    it('Should get repo and token informations', () => {
        githubInfo.repo.then(({ username, repo }) => {
            assert.deepEqual(username, 'github-tools', 'Get username from repo\'s folder');
            assert.deepEqual(repo, 'github-release-notes', 'Get the repository name from repo\'s folder');
        });

        githubInfo.token.then(({ token }) => {
            assert.isOk(token);
        });

        githubInfo.options.then(options => {
            assert.isOk(options[0].repo);
            assert.isOk(options[0].username);
            assert.isOk(options[1].token);
        });

    });
})
