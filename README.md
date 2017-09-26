# `gren` 🤖
> Github release notes and changelog generator

[![npm version](https://badge.fury.io/js/github-release-notes.svg)](https://badge.fury.io/js/github-release-notes)
[![Build Status](https://travis-ci.org/github-tools/github-release-notes.svg?branch=master)](https://travis-ci.org/github-tools/github-release-notes)
[![Join the chat at https://gitter.im/github-release-notes/Lobby](https://badges.gitter.im/github-release-notes/Lobby.svg)](https://gitter.im/github-release-notes/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Codecov](https://codecov.io/gh/github-tools/github-release-notes/branch/second-refactor/graph/badge.svg)](https://codecov.io/gh/github-tools/github-release-notes/)

## Motivation

Everyone loves neat, transparent, informative release notes.

Everyone would also rather avoid maintaining them. What a hassle to have to evaluate what issues have been solved between two points in project's timeline, what types of problems they were, are they important to inform the users about, what issues solved them etc.

Wouldn't it be great to get fantastic release notes compiled for you automaticaly based on all the hard work you put into your GitHub issues and pull requests.

## OK, what can `gren` do for me?

`gren` is a small helpful robot that will do for you just that! To put simply, it can create a release from a tag and compile the release notes using issues or commits.

It also can generate a `CHANGELOG.md` file based on the release notes (or generate a brand new).

- [The Concept](#the-concept)
- [Feed 🤖](#feed-gren-)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Configuration file](#configuration-file)
- [Full Documentation](https://github-tools.github.io/github-release-notes)

## The Concept

The main motivation for bringing `gren` to life was the need for auto generating release notes for every tag in a project.
The process, [as explained here](https://help.github.com/articles/creating-releases/), requires to go to your project's releases page in GitHub, draft that tag as a new release and manually add what I remembered has changed.

Let `gren` take care of that for you. It automates this process and also writes release notes for you, creating something like this:

> ## v0.6.0 (14/03/2017)
> 
> #### Framework Enhancements:
> 
> - [#32](https://github.com/github-tools/github-release-notes/issues/32) Unwrap github-api promises
> - [#26](https://github.com/github-tools/github-release-notes/issues/26) Use external config file
> - [#23](https://github.com/github-tools/github-release-notes/issues/23) Introduce templates for the issues
> - [#19](https://github.com/github-tools/github-release-notes/issues/19) Add an "ignore label" flag
> - [#12](https://github.com/github-tools/github-release-notes/issues/12) Add the chance to rebuild the history of release notes
> 
> #### Bug Fixes:
> 
> - [#29](https://github.com/github-tools/github-release-notes/issues/29) Remove escaping character on regex
> - [#24](https://github.com/github-tools/github-release-notes/issues/24) The changelog action doesn't compile latest release

_(yes, this is one of_ 🤖 _'s actual releases)_

## Feed `gren` 🤖

Where is the data coming from? There are two options:

### `issues` (⭐)

If you manage your project with issues, that's where all the information about a change are.
Issue labels increase the level of depth of what the release notes should show, helping `gren` to group the notes.

_e.g. if you see the example above, the issues are grouped by the two labels `enhancement` and `bug`, then customised via a config file._

`gren` generates those notes by collecting all the issues closed between a tag (defaults to latest) and the tag before it (or a tag that you specify).
If you want to be more accurate on the issues that belong to a release, you can group them in [milestones](https://github-tools.github.io/github-release-notes/examples.html#milestones) and use only the issues that belong to that Milestone.

> The output above is a result of release notes built from issues.

#### Help 🤖 to write wondeful stuff (issues)

In order to have spliendid generated release notes, we reccomend to follow these convensions:

1. Start the title with a verb (e.g. Change header styles)
2. Use the imperative mood in the title (e.g. Fix, not Fixed or Fixes header styles)
3. Use labels wisely and assign one label per issue. `gren` has the [option to ignore issues](#) _(alex: put link to options)_ that have a specified issues.

### `commits`

The simplest way of getting data is from the commits you write.
Even though it doesn't require a machine-readable commit, still would be better to have them in a nice format.

The output would then use commit messages (title + description) to look something like:

> ## v0.9.0 (17/05/2017)
> 
> - Filter milestones (#75)
>     * Create milestones data-source option
>     * Add documentation for the milestones option
> - Support GitHub enterprise (#73)
>     * Support GitHub enterprise
>     * Add api-url to options documentation
> - Update CHANGELOG.md

#### Help 🤖 to write wondeful stuff (commits)

In order to have spliendid generated release notes, we reccomend to follow these convensions:

1. Start the subject line with a verb (e.g. Change header styles)
2. Use the imperative mood in the subject line (e.g. Fix, not Fixed or Fixes header styles)
3. Limit the subject line to about 50 characters
4. Do not end the subject line with a period
5. Separate subject from body with a blank line
6. Wrap the body at 72 characters
7. Use the body to explain _what_ and _why_ not _how_

## Installation

Install `github-release-notes` via npm:

```shell
npm install github-release-notes -g
```

### Setup

First, generate a `GitHub token`, _with **repo** scope_, at [this link](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).
Then add this line to  `~/.bash_profile` (or `~/.zshrc`):

```shell
export GREN_GITHUB_TOKEN=your_token_here
```

## Basic Usage

`gren` gets the repo information directly from the folder where `git` is initialised.

```shell
# Navigate to your project directory
cd ~/Path/to/repo
# Run the task (see below)
gren release
```

Otherwise, you can run it _anywhere_ passing the repo information:

```shell
gren release --username=[username] --repo=[repo name]
```

If you don't want to save the token, you can specify one as an option:

```shell
gren release --token=[your token]
```

### [See all the options here](https://github-tools.github.io/github-release-notes/options.html)

### Commands

There are two main commands that can be ran with 🤖:

#### `gren release`

`gren` will look for the latest tag, draft a new release using the issues closed between when that tag and the one before were created and publish that release in your **release** panel in your GitHub repo. ([@see how to feed 🤖](#feed-gren-)).

#### `gren changelog`

Create a `CHANGELOG.md` file using all the release notes of the repo _(like the ones generated by_ 🤖 _)._
If the file exists already, use the `--override` option to proceed.

```shell
gren changelog --override
```

To generate a brand new release notes, using the same approach as per the releases, you have to run the command with the `--generate` option.

```shell
gren changelog --generate
```

### Help! 🆘

`gren` is using [Commander.js](https://github.com/tj/commander.js) which generates the `--help` section.
To trigger the help of a command, run:

```shell
# General usage
gren --help
# Command usage
gren help release # or gren release --help
```

It's also possible to see all the examples [here](https://github-tools.github.io/github-release-notes/examples.html) or directly in the terminal:

```shell
gren examples release
```

## Configuration file

You can create a configuration file where the task will be ran, where to specify your options. [See how to set up the config file](https://github-tools.github.io/github-release-notes/options.html#configuration-file)
The accepted file extensions are the following:

- `.grenrc`
- `.grenrc.json`
- `.grenrc.yml`
- `.grenrc.yaml`
- `.grenrc.js`

### [See full documentation here](https://github-tools.github.io/github-release-notes)
