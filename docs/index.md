---
layout: default
---

{:.page-heading}
# Welcome to gren's guide

Following you can find all the guides to use **gren** in the best way.

## Installation

Install `github-release-notes` via npm:

```shell
npm install github-release-notes -g
```

## Setup

First generate a `github token` at [this link](https://help.github.com/articles/creating-an-access-token-for-command-line-use/). _You only need "repo" scope._
Then add this to  `~/.bash_profile` or `~/.zshrc`):

```shell
export GREN_GITHUB_TOKEN=your_token_here
```

## Basic Usage

```shell
# Navigate to your project directory
cd ~/Path/to/repo
# Run the task
gren
```

Otherwise, you can run it anywhere passing the repo information:

```shell
gren --username=[username] --repo=[repo name]
```

To use a specific token you can specify it as option:

```shell
gren --token=[your token]
```

### Actions

**Gren** has two main usages: `release` and `changelog`.
You can select the action with the `--action` option.

[See few examples here]({{ "examples" | relative_url }}){:.page-heading}
