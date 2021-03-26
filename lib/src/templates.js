module.exports = {
    // NOTE: check if author is present as might be returned as null.
    commit: ({ message, url, author, name }) => `- [${message}](${url}) - ${author ? `@${author}` : name}`,
    issue: '- {{labels}} {{name}} [{{text}}]({{url}})',
    label: '[**{{label}}**]',
    noLabel: 'closed',
    group: '\n#### {{heading}}\n',
    changelogTitle: '# Changelog\n\n',
    release: '## {{release}} ({{date}})\n{{body}}',
    releaseSeparator: '\n---\n\n',
    dateTimeFormat: {
        locales: 'en-CH',
        options: {
            dateStyle: 'short',
            timeZone: 'UTC',
        },
    },
};
