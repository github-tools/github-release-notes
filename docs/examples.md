---
layout: default
title: Examples
---

{:.page-heading}
# Examples

**Gren** has several usages that you can have combining [all options]({{ "options" | relative_url }}).

### Simple

The simple way, just looks for the last tag, gets all the issues closed between that tag and the one before and creates the new release with the generated body.

```shell
# Navigate to your project directory
cd ~/Path/to/repo
# Run the task
gren
```

![exec gren]({{ "images/examples/exec_gren.gif" | relative_url }})

will generate:

![release output]({{ "images/examples/gren_release_output.png" | relative_url }})

The output style of the release body can be configured with the template option within the config file. [Click here for more details]({{ "options#configuration-file" | relative_url }})

### Commit messages

Adding the flag `--data-source=commits` will change the source of the release notes to be the commit messages.

```
gren --data-source=commits
```

### Release specific tags

The flag `--tags` accepts one or two tags.
If you only give one tag, it will get the issues (or commit messages) between that tag and the one before.
If you give two tags it will generate the release notes with the issues (or commit messages) between those two tag dates.

```
gren --tags=2.0.0,1.0.0
```

If you want to override a single release, simple use:

```
gren --tags=0.3.0 --override
```

#### Roll out all releases

Using `all` as value of the same option, you can roll out all the releases of the project.
If the tag is already a release, the script will skip it, unless you pass the flag `--override`

```
gren --tags=all
```

![exec gren all tags]({{ "images/examples/exec_gren_all_tags.gif" | relative_rul }})

### Group by

You can group the issues in the release notes. So far the only way to group them is by label and you can do it in two different ways:

1. Just using the first label of an issue to group it.

```json
{
    "groupBy": "label"
}
```

2. Using an object where the keys are the group names, and the values are the arrays of labels included in that group.

```json
{
    "groupBy": {
        "Bug fixes:": ["bug"],
        "Framework Enhancements:": ["enhancement"]
    }
}
```

An issue with no label will be included using the template option `no-label` (default "_closed_") as group name.
To list all the issues that have any other label, use `"..."` as label name.

```javascript
{
    "groupBy": {
        "Bug fixes:": ["bug"],
        "Other stuff:": ["..."] // This will include the issues that have any label but not "bug"
    }
}
```

### Changelog

The `changelog` action will generate a `CHANGELOG.md` file where you run the script. The content of the file will be generated in different ways, depending of the options you provide:

1. Get release notes from github releases, which you might have generated with this tool or not. _N.B. if the file exists already the script **won't** override it, unless you use the flag `--override`_ 
```shell
gren --action=changelog
```
2. Generate the release notes independently using the `gren` script. This will allows you to use all the [options]({{ "options#global-options" | relative_url }}) that the release script uses.
```shell
gren --action=changelog --generate --tags=all
```
3. Override existing release notes and generate new ones from the task and replace the `CHANGELOG.md` file.
```shell
gren --action=changelog --time-wrap=history --override
```

You can also change the filename with the option `--changelog-filename`. For a complete reference, check the [options]({{ "options#changelog-options" | relative_url }}).

The changelog will look like this (depending of your template configuration):

> # Changelog
##  v0.4.3 (02/03/2016)
[**bug**] This is a issue name [#123](https://github.com/github-tools/github-tools)

To see a full example of the changelog here [CHANGELOG.md](https://github.com/github-tools/github-release-notes/blob/master/CHANGELOG.md)
