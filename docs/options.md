---
layout: default
title: Options
---

{:.page-heading}
# Options

Below all the options for github-release-notes.
You can find [Global options](#global-options), [Options for the release action](#release-options) and [Options for the changelog action](#changelog-options)

To use an option in your terminal, prefix it with `--` _(e.g. `gren --data-source=commits`)_
To pass it to the `GithubReleaseNotes` class, in the [configuration file](#configuration-file) or in the [grunt task](https://github.com/github-tools/grunt-github-release-notes), they need to be `camelCase`.

### Global options

| Command | Options | Description | Default |
| ------- | ------- | ----------- | ------- |
| `username` | **Required** | The username of the repo _e.g. `github-tools`_ | `null` |
| `repo` | **Required** | The repository name _e.g. `github-release-notes`_ | `null` |
| `action`| `release` `changelog` | The **gren** action to run. _(see details below for changelog generator)_ | `release` |
| `ignore-labels` | `wont_fix` `wont_fix,duplicate` | Ignore issues that contains one of the specified labels. | `false` |
| `ignore-issues-with` | `wont_fix` `wont_fix,duplicate` | Ignore issues that contains one of the specified labels. | `false` |
| `data-source` | `issues` `commits` | The informations you want to use to build release notes. | `issues` |
| `prefix` | **String** `e.g. v` | Add a prefix to the tag version. | `null` |
| `override` | **Flag** | Override the release notes if existing. | `false` |
| `include-messages` | `merge` `commits` `all` | Filter the messages added to the release notes. _Only used when `data-source` used is `commits` | `commits` |

### Release options

| Command | Options | Description | Default |
| ------- | ------- | ----------- | ------- |
| `draft` | **Flag** | Set the release as a draft. | `false` |
| `prerelease` | **Flag** | To set the release as a prerelease. | `false` |
| `tags`    |   `0.1.0` `0.2.0,0.1.0` `all` |   A specific tag or the range of tags to build the release notes from. You can also specify `all` to write all releases. _(To override  existing releases use the --override flag)_ | `false` |

### Changelog options

| Command | Options | Description | Default |
| ------- | ------- | ----------- | ------- |
| `time-wrap` | `latest` `history` | The release notes you want to include in the changelog. | `latest` |
| `changelog-filename` | **String**, like `changelog.md` | The name of the changelog file. | `CHANGELOG.md` |

---

## Configuration file

You can create a configuration file where the task will be ran, where to specify your options.
The options in the file would be camelCase *e.g*:

```json
{
    "action": "release",
    "timeWrap": "history",
    "dataSource": "commits",
    "ignoreIssuesWith": [
        "wontfix",
        "duplicate"
    ]
}
```

The accepted file extensions are the following:

- `.grenrc`
- `.grenrc.json`
- `.grenrc.yml`
- `.grenrc.yaml`
- `.grenrc.js`

#### Templates

You can configure the output of **gren** using templates. Set your own configuration inside the config file, which will be merged with the defaults, shown below:

{% raw %}
```json
{
    "template": {
        "commit": "- {{message}}",
        "issue": "- {{labels}} {{name}} {{link}}",
        "issueInfo": {
            "labels": "{{labels}}",
            "label": "[**{{label}}**]",
            "name": "{{name}}",
            "link": "[{{text}}]({{url}})"
        },
        "release": "## {{release}} {{date}}",
        "releaseInfo": {
            "release": "{{release}}",
            "date": "({{date}})"
        }
    }
}
```
{% endraw %}
