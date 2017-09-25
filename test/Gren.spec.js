import { assert } from 'chai';
import Gren from '../lib/src/Gren.js';

describe('Gren', () => {
    let gren;

    beforeEach(() => {
        gren = new Gren({
            token: process.env.GREN_GITHUB_TOKEN,
            username: 'github-tools',
            repo: 'github-release-notes'
        });
    });

    it('Should generate the options', () => {
        assert.isOk(gren.options, 'The options exist');
    });
});
