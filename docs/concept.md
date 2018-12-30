---
layout: default
title: Concept
---

{:.page-heading}
# Concept

## Motivation

Everyone loves neat, transparent, informative release notes.

Everyone would also rather avoid maintaining them. What a hassle to have to evaluate what issues have been solved between two points in project's timeline, what types of problems they were, are they important to inform the users about, what issues solved them etc.

Wouldn't it be great to get fantastic release notes compiled for you automaticaly based on all the hard work you put into your GitHub issues and pull requests.

## OK, what can `gren` do for me?

`gren` is a small helpful robot that will do for you just that! To put simply, it can create a release from a tag and compile the release notes using issues or commits.

It also can generate a `CHANGELOG.md` file based on the release notes (or generate a brand new).

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

#### Help 🤖 to write wonderful stuff (issues)

In order to have splendidly generated release notes, we reccomend to follow these convensions:

1. Start the title with a verb (e.g. **Change** header styles)
2. Use the imperative mood in the title (e.g. Fix, not Fixed or Fixes header styles)
3. Use labels wisely and assign one label per issue. `gren` has the [option to ignore issues](https://github-tools.github.io/github-release-notes/options.html#ignore-issues-with) that have more than one of the specified labels.

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

In order to have splendidly generated release notes, we reccomend to follow these convensions:

1. Start the subject line with a verb (e.g. **Change** header styles)
2. Use the imperative mood in the subject line (e.g. Fix, not Fixed or Fixes header styles)
3. Limit the subject line to about 50 characters
4. Do not end the subject line with a period
5. Separate subject from body with a blank line
6. Wrap the body at 72 characters
7. Use the body to explain _what_ and _why_ not _how_
