# Github Release Notes

[![npm version](https://badge.fury.io/js/github-release-notes.svg)](https://badge.fury.io/js/github-release-notes)
[![Build Status](https://travis-ci.org/github-tools/github-release-notes.svg)](https://travis-ci.org/github-tools/github-release-notes)

> Node module that generates release notes based on commit messages or closed issues between tags. It also can create a full changelog or add the latest release notes to the existing changelog file.

## Installation

Install `github-release-notes` via npm:

```shell
npm install github-release-notes -g
```

## Usage

**gren** can be ran through the terminal, but before you can use it, you need to set up a couple of things.

### Github Informations

**gren** by default looks for your local git configuration to get the repo informations. This means you can run the command directly from the git repo folder.

Otherwise, you can run it from wherever and specify a different repo as target, with:

```shell
gren --username=[username] --repo=[repo name]
```

#### Token

To work, **gren** needs a `github token` (that can be easily generated following [this link](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)). _You only need "repo" scope._

Once generated, you can run the gren command with the token as variable:

```shell
gren --token=your_token_here
```

Or you can add it to your `~/.bash_profile` or `~/.zshrc`) as follows:

```shell
export GREN_GITHUB_TOKEN=your_token_here
```

And you're ready to use it! Just run this command in your terminal:

```shell
gren
```

The module will look for the last tag, get all the issues closed in the time between that tag and the one before, and it will build release notes and draft the new release!

## Options

Following the options for the module:

- `--action=release|changelog` The **gren** action to run. Default: `release` _(see details below for changelog generator)_
- `--tags=0.1.0|0.2.0,0.1.0` A specific tag or the range of tags to build the release notes from.
- `--time-wrap=latest|history` The release notes you want to include in the changelog. Default: `latest` _Only applicable to the `changelog` action_
- `--changelog-filename=CHANGELOG.md` The name of the changelog file. Default: `CHANGELOG.md`
- `--data-source=issues|commits` The informations you want to use to build release notes. Default: `issues`
- `--draft=true|false` To set the release as a draft. Default: `false`
- `--prerelease=true|false` To set the release as a prerelease. Default: `false`
- `--prefix=v` Add a prefix to the tag version `e.g. v1.0.1`. Default: `null`
- `--include-messages=merges|commits|all` used to filter the messages added to the release notes. Default: `commits`
- `--override=true|false` Override the release notes if existing. Default: `false`

## Examples

The ways to use **gren** are various.

### Simple

The simple way, just looks for the last tag, gets all the issues closed between that tag and the one before and creates the new release with the generated body.

```
gren
```

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

### Override an existing release

If you trying to create an existing release, **gren** will throw an error *"0.3.0 is a release, use --override flag to override an existing release!*
If you want then to override, simple use:

```
gren --override --tags=0.3.0
```


## Changelog Generator

**gren** can also update generate the changelog.

The following command, will generate the release notes for the latest release, and add it to an existing file or create it in the same directory where you run the command.

```shell
gren --action=changelog
```

The generated release notes will be added at the top of the file, and will look like this:

> # Changelog
##  v0.4.3 (02/03/2016)
[**bug**] This is a issue name [#123](https://github.com/github-tools/github-tools)

### Generate a full changelog

If tou want to generate the whole changelog, you need to use the `--time-wrap=history`. This will generate a changelog based on issues (or on commit messages if the `--data-source=commits` is present).

If you want to override the existing changelog, use `--override`.

The usage would then be:

```
gren --time-wrap=history --override
```

To see a full example of the changelog here [CHANGELOG.md](#)