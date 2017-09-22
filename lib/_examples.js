const chalk = require('chalk');

/**
 * Generate examples based on an Array
 *
 * @param  {Array} examples
 */
function generateExamples(title, examples) {
    process.stdout.write(`\n  Examples for ${title}:`);
    const spaceify = number => new Array(number ? number + 1 : 0).join(' ');
    const spaces = spaceify(6);
    const namePlaceholder = spaceify(Math.max(...examples.map(({ name }) => name ? name.length : 0)));
    const descriptionPlaceholder = spaceify(Math.max(...examples.map(({ description }) => description ? description.length : 0)));

    examples.forEach(({ name, description, code }) => {
        const tabs = spaceify(description && descriptionPlaceholder.length - description.length);

        if (name) {
            process.stdout.write(`\n\n    ${chalk.blue(name)}:\n`);
        } else {
            process.stdout.write(namePlaceholder);
        }

        if (description) {
            process.stdout.write(`\n      ${description}`);
        } else {
            process.stdout.write(descriptionPlaceholder);
        }

        if (code) {
            process.stdout.write(`${spaces}${tabs}${chalk.green(`[ ${code} ]`)}\n`);
        }
    });
}

module.exports = {
    generateExamples,
    gren: [
        {
            name: 'Help',
            description: 'Show the general help of the gren tool',
            code: 'gren'
        },
        {
            code: 'gren --help'
        },
        {
            code: 'gren -h'
        },
        {
            name: 'Version',
            description: 'Show the using version',
            code: 'gren --version'
        },
        {
            code: 'gren -v'
        },
        {
            description: 'Get help for the release options',
            code: 'gren help release'
        }
    ],
    release: [
        {
            name: 'Manual repo infos',
            description: 'Run gren outside of the project folder.',
            code: 'gren release --username=REPO_USER --repo=REPO_NAME'
        },
        {
            name: 'Override an existing release',
            description: 'By default, `gren` won\'t override an existing release and it will flag `Skipping 4.0.0 (use --override to replace it)`. If you want to override, as it suggests, use:',
            code: 'gren release --override'
        },
        {
            name: 'Create release notes for a specific tag',
            description: 'Get the commits or issues closed between the specified tag and the one before.',
            code: 'gren release --tags=4.0.0'
        },
        {
            description: 'Get the commits or the issues between two specified tags.',
            code: 'gren release --tags=4.0.0..3.0.0'
        },
        {
            name: 'Create release notes for all the tags',
            description: 'Get the commits or issues closed between the specified tag and the one before.',
            code: 'gren release --tags=*'
        },
        {
            description: '_`all` instead of `*` will be deprecated in 1.0.0_ ',
            code: 'gren release --tags=all'
        },
        {
            name: 'Work with milestones',
            description: 'Create release notes for a tag using the belonging to a milestone that matches the name of the tag. e.g. If the tag is 4.0.0, `gren` is going to match the milestone _"Release 4.0.0"_.',
            code: 'gren release --data-source=milestones --milestone-match="Release {{tag_name}}"'
        },
        {
            description: 'Otherwise, you can just filter the issues that belong to _a_ milestone',
            code: 'gren release --only-milestones'
        }
    ],
    changelog: [
        {
            name: 'Custom changelog',
            description: 'Create a changelog with a custom filename',
            code: 'gren changelog --generate --override --changelog-filename=RELEASE_NOTES.md'
        }
    ]
};

