---
title: "nb portal push"
description: "nb portal push command reference: push local Portal source changes to source storage."
keywords: "nb portal push,NocoBase CLI,Portal"
---

# nb portal push

Pusht lokale Portal-Quellcodeänderungen in den source storage

## Verwendung

```bash
nb portal push <portal> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--message`, `-m` | string | Source update message; for Git-managed source, it is used as the Git commit message. |

## Beispiele

```bash
nb portal push customer
nb portal push customer --env prod --yes
nb portal push customer --message "Update customer portal"
```

## Hinweise

The command reads source storage and Git settings from the remote portal record, then reads local source from the development path stored in the selected CLI env config. Git source storage clones the configured repo, copies the local workspace into `--git-path`, commits, and pushes. With default `nocobase` storage, `local` and `docker` envs are usually no-op; `http` envs upload a source archive through the API.

## Verwandte Befehle

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
