---
title: "nb self check"
description: "nb self check command reference: check installed NocoBase CLI version and self-update support."
keywords: "nb self check,NocoBase CLI,version check"
---

# nb self check

Check the current NocoBase CLI installation, resolve the latest version for the selected channel, and report whether self-update is supported.

## Usage

```bash
nb self check [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--channel` | string | Release channel to compare with, default `auto`; options: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Output JSON |

## Install Method

`nb self check` detects the current install method at runtime. It does not use the historical `self-install-methods.json` cache.

The command can report these install methods:

| Install method | Meaning |
| --- | --- |
| `npm-global` | The CLI is installed under the current `npm prefix -g`. |
| `pnpm-global` | The CLI is installed under a pnpm global `node_modules` tree. |
| `yarn-global` | The CLI is launched from `yarn global bin` or installed under `yarn global dir`. |
| `package-local` | The CLI is installed in a local project dependency tree. |
| `source` | The CLI is running from a repository checkout. |
| `unknown` | The CLI install could not be matched to a supported install method. |

Self-update is supported for `npm-global`, `pnpm-global`, and `yarn-global`. For `package-local` or `source`, update the parent project or repository checkout instead.

## Examples

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Related Commands

- [`nb self update`](./update.md)
