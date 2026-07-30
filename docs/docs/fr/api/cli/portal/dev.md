---
title: "nb portal dev"
description: "nb portal dev command reference: start a Portal in development mode."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

Démarre le mode développement pour le workspace Portal spécifié

## Utilisation

```bash
nb portal dev <portal> [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `--dir` | string | Portal workspace directory. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Exemples

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## Notes

The workspace must contain `package.json`. The command refreshes `.env` and `.env.local`, then runs `pnpm dev`. `ssh` envs are not supported in the current version.

## Commandes liées

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
