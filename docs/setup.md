---
layout: default
title: Setup
---

{:.page-heading}
# Setup

**gren** can be ran through the terminal, but before you can use it, you need to set up a couple of things.

### Token

To work, **gren** needs a `github token` (that can be easily generated following [this link](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)). _You only need "repo" scope._

Once generated, you can run the gren command with the token as variable:

```shell
gren --token=your_token_here
```

Or you can add it to your `~/.bash_profile` or `~/.zshrc`) as follows:

```shell
export GREN_GITHUB_TOKEN=your_token_here
```

### Github Informations

**gren** by default looks for your local git configuration to get the repo informations. This means you can run the command directly from the git repo folder.

Otherwise, you can run it from wherever and specify a different repo as target, with:

```shell
gren --username=[username] --repo=[repo name]
```
