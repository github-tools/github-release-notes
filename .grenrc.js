module.exports = {
    "ignoreIssuesWith": [
        "duplicate",
        "wontfix",
        "invalid",
        "help wanted"
    ],
    "template": {
        issue: ({ text, name, url, labels }) => {
            labels = labels.slice(0, -1);

            return `- [${text}](${url}) ${name} - ${labels}`;
        },
        "label": "_{{label}}_,"
    }
}
