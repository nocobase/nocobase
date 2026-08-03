---
title: "nb portal info"
description: "nb portal info command reference: show Portal record and local workspace details."
keywords: "nb portal info,NocoBase CLI,Portal"
---

# nb portal info

Affiche les détails de l’enregistrement Portal spécifié et du workspace local

## Utilisation

```bash
nb portal info <portal> [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `--json`, `-j` | boolean | Print Portal details as JSON. |

## Exemples

```bash
nb portal info customer
nb portal info customer --env dev --yes
nb portal info customer --json
```

## Notes

Text output includes name, URL, portal type, development path, deployment path, and enabled status. `--json-output` and its alias `--json` print `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, `isDefault`, and `sourceStorage`. You can query by `routeName` or `uid`.

## Commandes liées

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
