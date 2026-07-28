---
title: "nb portal dev"
description: "nb portal dev command reference: start a Portal in development mode."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

Startet den Entwicklungsmodus für den angegebenen Portal-Workspace

## Verwendung

```bash
nb portal dev <portal> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Beispiele

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## Hinweise

The workspace must contain `package.json`. The command refreshes `.env` and `.env.local`, then runs `pnpm dev`. `ssh` envs are not supported in the current version.

## Verwandte Befehle

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
