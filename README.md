# github-release-notes
Node module which generates a release from the latest tag and compiles release notes based on commit messages between the last tag and the latest release.

## Installation

Install `github-release-notes` via npm:

```
npm install github-release-notes --save-dev
```

## Usage

You can run the command via the terminal (the three arguments are all required):

```
node github-release-notes --token=[token] --username=[username] --repo=[repo name]
```

To generate a github token, follow [this link](https://help.github.com/articles/creating-an-access-token-for-command-line-use/);

### Optionals

There are optional arguments such as:

- `--draft=true` To set the release as a draft
- `--prerelease=true` To set the release as a prerelease
- `--prefix=v` Add a prefix to the tag version `e.g. v1.0.1`
