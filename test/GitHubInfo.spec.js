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
    })
})
