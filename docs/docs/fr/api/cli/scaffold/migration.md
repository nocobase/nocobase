---
title: "nb scaffold migration"
description: "Référence de la commande nb scaffold migration : générer un script de migration pour un plugin NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,script de migration,migration"
---

# nb scaffold migration

Générer un fichier de script de migration pour un plugin.

## Utilisation

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<name>` | string | Nom du script de migration, requis |
| `--pkg` | string | Nom du package du plugin auquel rattacher la migration, requis |
| `--on` | string | Moment d'exécution : `beforeLoad`, `afterSync` ou `afterLoad` |

## Exemples

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Commandes connexes

- [`nb scaffold plugin`](./plugin.md)
- [Développement de plugins](../../../plugin-development/index.md)
