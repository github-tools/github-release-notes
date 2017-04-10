module.exports = {
    "prefix": "v",
    "ignoreIssuesWith": [
        "duplicate",
        "wontfix",
        "invalid",
        "help wanted"
    ],
    "template": {
        "issue": "- [{{text}}]({{url}}) {{name}}"
    },
    "groupBy": {
        "Framework Enhancements:": ["enhancement"],
        "Bug Fixes:": ["bug"]
    }
};
