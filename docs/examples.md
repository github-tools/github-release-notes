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

### Changelog

There different ways to generate the changelog:

1. Get last release notes from github and prepend them to the `CHANGELOG.md` file.
```shell
gren --action=changelog
```
2. Use all release notes from github and prepend them to the `CHANGELOG.md` file.
```shell
gren --action=changelog --time-wrap=history
```
3. Override existing release notes and generate new ones from the task and replace the `CHANGELOG.md` file.
```shell
gren --action=changelog --time-wrap=history --override
```

You can also change the filename with the option `--changelog-filename`. For a complete reference, check the [options]({{ "options#changelog-options" | relative_url }}).

The changelog will look like this:

> # Changelog
##  v0.4.3 (02/03/2016)
[**bug**] This is a issue name [#123](https://github.com/github-tools/github-tools)

To see a full example of the changelog here [CHANGELOG.md](https://github.com/github-tools/github-release-notes/blob/master/CHANGELOG.md)
