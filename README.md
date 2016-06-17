# Github Release Notes

[![npm version](https://badge.fury.io/js/github-release-notes.svg)](https://badge.fury.io/js/github-release-notes)
[![build](https://travis-ci.org/github-tools/github-release-notes.svg)](https://travis-ci.org/github-tools/github-release-notes)

> Node module that generates a release from the latest tag and compiles release notes based on commit messages or closed issues between the last tag and the latest release. It also can create a full changelog or add the latest release notes to the existing changelog file.

## Installation

The plugin requires `^0.12.`

Install `github-release-notes` via npm:

```shell
npm install github-release-notes --save-dev
```

## Usage

**gren** can be ran through the terminal, but before you can use it, you need to set up a couple of things.

### Github Informations

**gren** by default looks for your local git configuration to get the repo informations. This means you need to run the command from the git repo folder.

If you want, you can run it from wherever and specify a different repo as target, with:

```shell
node github-release-notes --username=[username] --repo[repo name]
```

#### Token

To work, **gren** needs a `github token` (that can be easily generated following [this link](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)). _You only need "repo" scope for private repositories._

Once generated, you can run the gren command with the token as variable:

```shell
node github-release-notes --token=your_token_here
```

Or you can add it to your `~/.bash_profile` or `~/.zshrc`) as follows:

```shell
export GREN_GITHUB_TOKEN=your_token_here
```

And you're ready to use it! Just run this command in your terminal:

```shell
node github-release-notes
```

The module will look for the last tag, get all the issues closed in the time between that tag and the latest release, and it wiil build release notes and draft the new release!

## Options

Following the options for the module:

- `--action=release|changelog` The **gren** action to run. Default: `release` _(see details below for changelog generator)_
- `--timeWrap=latest|history` The release notes you want to include in the changelog. Default: `latest` _Only applicable to the `changelog` action_
- `--changelogFilename=CHANGELOG.md` The name of the changelog file. Default: `CHANGELOG.md`
- `--dataSource=issues|commits` The informations you want to use to build release notes. Default: `issues`
- `--draft=true|false` To set the release as a draft. Default: `false`
- `--prerelease=true|false` To set the release as a prerelease. Default: `false`
- `--prefix=v` Add a prefix to the tag version `e.g. v1.0.1`. Default: `null`
- `--include-messages=merges|commits|all` used to filter the messages added to the release notes. Default: `commits`
- `--override=true|false` Override the release notes if existing. Default: `false`
