---
title: "nb scaffold plugin"
description: "Référence de la commande nb scaffold plugin : générer le squelette d'un plugin NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold de plugin"
---

# nb scaffold plugin

Générer le code squelette d'un plugin NocoBase.

## Utilisation

```bash
nb scaffold plugin <pkg> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<pkg>` | string | Nom du package du plugin, requis |
| `--force-recreate`, `-f` | boolean | Forcer la recréation du squelette de plugin |

## Exemples

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Commandes connexes

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
