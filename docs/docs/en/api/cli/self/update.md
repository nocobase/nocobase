---
title: "nb self update"
description: "nb self update command reference: update the globally npm-, pnpm-, or yarn-installed NocoBase CLI."
keywords: "nb self update,NocoBase CLI,update,self update"
---

# nb self update

Update the installed NocoBase CLI when the current CLI is managed by a standard global npm, pnpm, or yarn installation.

## Usage

```bash
nb self update [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--channel` | string | Release channel to update to, default `auto`; options: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Skip update confirmation |
| `--json` | boolean | Output JSON |
| `--skills` | boolean | Also refresh the globally installed NocoBase AI coding skills |
| `--verbose` | boolean | Show detailed update output |

## Update Behavior

`nb self update` first detects the current install method at runtime. It does not use the historical `self-install-methods.json` cache.

When an update is available, the command uses the same package manager that manages the current global CLI install:

| Install method | Update command |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

Interactive confirmation defaults to yes. Use `--yes` to skip the prompt in scripts.

## Examples

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Related Commands

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
