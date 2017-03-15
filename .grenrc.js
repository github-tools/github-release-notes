module.exports = {
    "ignoreIssuesWith": [
        "duplicate",
        "wontfix",
        "invalid",
        "help wanted"
    ],
    "template": {
        "issue": "- [{{text}}]({{url}}) {{name}}",
        "group": ({ heading }) => {
            heading = heading.charAt(0).toUpperCase() + heading.slice(1);

            return `#### ${heading}s\n`;
        }
    },
    "groupBy": "label"
};
