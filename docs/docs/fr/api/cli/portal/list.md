---
title: "nb portal list"
description: "nb portal list command reference: list portal records and development paths."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

Liste les enregistrements Portal et l’état de synchronisation du workspace local

## Utilisation

```bash
nb portal list [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `--json`, `-j` | boolean | Print Portal records as JSON. |

## Exemples

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json
```

## Notes

The list shows name, URL, portal type, source storage, development path, and enabled status. `--json-output` and its alias `--json` print `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, and `sourceStorage`.

## Commandes liées

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
