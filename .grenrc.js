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
        "Enhancements:": ["enhancement", "internal"],
        "Bug Fixes:": ["bug"]
    }
};
