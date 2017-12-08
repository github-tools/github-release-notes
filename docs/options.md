---
layout: default
title: Options
---

{:.page-heading}
# Options

See all the options for `gren`.

The **global options** are shared between the `gren release` and `gren changelog` commands, as `gren changelog --generate` can create release notes and a `CHANGELOG.md` file, instead of getting all the releases from project release notes.

To use an option in your terminal, prefix the name with `--` _(e.g. `gren release --data-source=commits`)_

To pass it to the `Gren` class or in the [configuration file](#configuration-file) they need to be `camelCase` _(e.g. `"dataSource": "commits"`)_.

{% include functions/show-options.html title='Global' options=site.data.global-options %}
{% include functions/show-options.html title='Release' options=site.data.release-options %}
{% include functions/show-options.html title='Changelog' options=site.data.changelog-options %}

## Configuration file

You can create a configuration file where the task will be ran, where to specify your options.
The options are the same on specified above but in camelCase *e.g*:

```json
{
    "dataSource": "commits",
    "ignoreIssuesWith": [
        "wontfix",
        "duplicate"
    ],
    "template": {
        ...
    }
}
```

If you need help to create the configuration file, you can run the following command and follow the instructions

```
gren init
```

### Group By

Via the configuration file you can have more complex grouping, using labels in a more creative way.
`gren` will use the keys of the given Object as titles and group all the issues that contain one or more of the labels in the value Array. A bit complex to understand? Just see the example:

```json
{
    "groupBy": {
        "Enhancements:": ["enhancement", "internal"],
        "Bug Fixes:": ["bug"]
    }
}
```

In this case `gren` will group all the issues labeled with `enhancement` and `internal` under the title _"Enhancements: "_ and all the ones with `bug` under the title _"Bug Fixes: "_.

### Extensions

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
        "commit": "- [{{message}}]({{url}}) - @{{author}}",
        "issue": "- {{labels}} {{name}} [{{text}}]({{url}})",
        "label": "[**{{label}}**]",
        "noLabel": "closed",
        "group": "\n#### {{heading}}\n",
        "changelogTitle": "# Changelog\n\n",
        "release": "## {{release}} ({{date}})\n{{body}}",
        "releaseSeparator": "\n---\n\n"
    }
}
```
{% endraw %}

If you're using a `.grenrc.js` config file, you can use JavaScript to manipulate the templates using functions as values.
The function will have an object as first parameter, containing all the values to display. _i.e._

```javascript
/* .grenrc.js */

module.exports = {
    template: {
        issue: function (placeholders) {
            return '- ' + placeholders.labels + ' | ' + placeholders.name.toLowerCase();
        }
    }
}
```
