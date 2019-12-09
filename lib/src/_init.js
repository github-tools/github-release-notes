import inquirer from 'inquirer';
import utils from './_utils';
import GitHubInfo from './GitHubInfo';
import GitHub from 'github-api';
import chalk from 'chalk';
import { isUri } from 'valid-url';

const githubApi = new GitHubInfo();
const prompt = inquirer.createPromptModule();
const { GREN_GITHUB_TOKEN } = process.env;

if (!GREN_GITHUB_TOKEN) {
    console.error(chalk.red('Can\'t find GREN_GITHUB_TOKEN. Please configure your environment') + chalk.blue('\nSee https://github.com/github-tools/github-release-notes#setup'));

    process.exit(1);
}

const getInfo = async() => {
    try {
        const infos = await githubApi.repo;

        return infos;
    } catch (error) {
        throw chalk.red('You have to run this command in a git repo folder');
    }
};

const getLabels = async() => {
    const { username, repo } = await getInfo();

    try {
        const gitHub = new GitHub({
            GREN_GITHUB_TOKEN
        });
        const issues = gitHub.getIssues(username, repo);
        const { data: labels } = await issues.listLabels();

        return labels;
    } catch (error) {
        console.warn(chalk.bgYellow(chalk.black('I can\'t get your repo labels, make sure you are online to use the complete initialisation')));
        return false;
    }
};

const getQuestions = async() => {
    const labels = await getLabels();

    return [
        {
            name: 'apiUrlType',
            type: 'list',
            message: 'What type of APIs do you need?',
            choices: [{
                name: 'Normal',
                value: false
            },
            {
                name: 'GitHub Enterprise',
                value: 'ghe'
            }]
        },
        {
            name: 'apiUrl',
            type: 'input',
            message: 'Write your Enterprise url',
            suffix: chalk.blueBright(' e.g. https://MY_ENTERPRISE_DOMAIN/api/v3'),
            when: ({ apiUrlType }) => apiUrlType === 'ghe',
            validate: value => isUri(value) ? true : 'Please type a valid url'
        },
        {
            name: 'dataSource',
            type: 'list',
            message: 'Where shall I get the informations from?',
            choices: [{
                value: 'issues',
                name: 'Issues (Time based)'
            },
            {
                value: 'milestones',
                name: 'Issues (Milestone based)'
            },
            {
                value: 'commits',
                name: 'Commits'
            },
            {
                value: 'prs',
                name: 'Pull Requests'
            }]
        },
        {
            name: 'prefix',
            type: 'input',
            suffix: chalk.blueBright(' e.g. v'),
            message: 'Do you want to add a prefix to release titles?'
        },
        {
            name: 'includeMessages',
            type: 'list',
            message: 'Which type of commits do you want to include?',
            choices: [{
                value: 'merges',
                name: 'Merges'
            },
            {
                value: 'commits',
                name: 'Commits'
            },
            {
                value: 'all',
                name: 'All'
            }],
            when: ({ dataSource }) => dataSource === 'commits'
        },
        {
            name: 'ignoreCommitsWithConfirm',
            type: 'confirm',
            default: false,
            message: 'Do you want to ignore commits containing certain words?',
            when: ({ dataSource }) => dataSource === 'commits'
        },
        {
            name: 'ignoreCommitsWith',
            type: 'input',
            message: 'Which ones? Use commas to separate.',
            suffix: chalk.blueBright(' e.g. changelog,release'),
            when: ({ ignoreCommitsWithConfirm, dataSource }) => dataSource === 'commits' && ignoreCommitsWithConfirm,
            filter: value => value.replace(/\s/g).split(',')
        },
        {
            name: 'ignoreLabelsConfirm',
            type: 'confirm',
            default: false,
            message: 'Do you want to not output certain labels in the notes?',
            when: ({ dataSource }) => Array.isArray(labels) && dataSource !== 'commits'
        },
        {
            name: 'ignoreLabels',
            type: 'checkbox',
            message: 'Select the labels that should be excluded',
            when: ({ ignoreLabelsConfirm }) => ignoreLabelsConfirm,
            choices: Array.isArray(labels) && labels.map(({ name }) => name)
        },
        {
            name: 'ignoreIssuesWithConfirm',
            type: 'confirm',
            message: 'Do you want to ignore issues/prs that have certain labels?',
            default: false,
            when: ({ dataSource }) => Array.isArray(labels) && dataSource !== 'commits'
        },
        {
            name: 'ignoreIssuesWith',
            type: 'checkbox',
            message: 'Select the labels that should exclude the issue',
            when: ({ ignoreIssuesWithConfirm }) => ignoreIssuesWithConfirm,
            choices: Array.isArray(labels) && labels.map(({ name }) => name)
        },
        {
            name: 'onlyMilestones',
            type: 'confirm',
            message: 'Do you want to only include issues/prs that belong to a milestone?',
            default: false,
            when: ({ dataSource }) => dataSource === 'issues' || dataSource === 'prs'
        },
        {
            name: 'ignoreTagsWithConfirm',
            type: 'confirm',
            default: false,
            message: 'Do you want to ignore tags containing certain words?'
        },
        {
            name: 'ignoreTagsWith',
            type: 'input',
            message: 'Which ones? Use commas to separate',
            suffix: chalk.blueBright(' e.g. -rc,-alpha,test'),
            filter: value => value.replace(/\s/g).split(','),
            when: ({ ignoreTagsWithConfirm }) => ignoreTagsWithConfirm
        },
        {
            name: 'groupBy',
            type: 'list',
            message: 'Do you want to group your notes?',
            when: ({ dataSource }) => dataSource !== 'commits',
            choices: [{
                value: false,
                name: 'No'
            },
            {
                value: 'label',
                name: 'Use existing labels'
            },
            {
                value: {},
                name: 'Use custom configuration'
            }]
        },
        {
            name: 'milestoneMatch',
            type: 'input',
            default: 'Release {{tag_name}}',
            message: 'How can I link your tags to Milestone titles?',
            when: ({ dataSource }) => dataSource === 'milestones'
        },
        {
            name: 'changelogFilename',
            default: 'CHANGELOG.md',
            message: 'What file name do you want for your changelog?',
            vaidate: value => {
                console.log(utils.getFileExtension(value));
                return utils.getFileExtension(value) === 'md' ? true : 'Has to be a markdown file!';
            }
        },
        {
            name: 'fileExist',
            type: 'list',
            message: 'Looks like you already have a configuration file. What do you want me to do?',
            choices: [{
                value: 'abort',
                name: 'Oops, stop this'
            },
            {
                value: 'override',
                name: 'Override my existing file'
            },
            {
                value: 'merge',
                name: 'Merge these settings over existing ones'
            }],
            when: () => Object.keys(utils.getGrenConfig(process.cwd())).length > 0
        },
        {
            name: 'fileType',
            type: 'list',
            message: 'Which extension would you like for your file?',
            choices: utils.getFileTypes(),
            when: ({ fileExist }) => fileExist !== 'abort'
        }
    ];
};

const configure = async() => {
    const questions = await getQuestions();
    process.stdout.write('\n🤖 : Hello, I\'m going to ask a couple of questions, to set gren up!\n\n');

    return prompt(questions);
};

export default configure;
