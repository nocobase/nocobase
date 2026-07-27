---
title: "nb portal config"
description: "nb portal config command reference: update source storage and Git source configuration for a Portal workspace."
keywords: "nb portal config,NocoBase CLI,Portal"
---

# nb portal config

Update the local Portal workspace source configuration and sync it to the remote Portal record when possible

## Usage

```bash
nb portal config <portal> [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the Portal slug. |

## Examples

```bash
nb portal config customer --source-storage nocobase
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal config customer --git-branch main --git-path customer
```

## Notes

Pass at least one configuration flag. The local workspace must already exist; use `nb portal create` or `nb portal pull` first. If the remote Portal record exists, the configuration is synced to it; otherwise only `portal.config.json` is updated locally.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
