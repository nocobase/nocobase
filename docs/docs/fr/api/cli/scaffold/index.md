---
title: "nb scaffold"
description: "Référence de la commande nb scaffold : générer des squelettes de plugin et de scripts de migration NocoBase."
keywords: "nb scaffold,NocoBase CLI,scaffold,plugin,migration"
---

# nb scaffold

Générer les squelettes utiles au développement de plugins NocoBase.

## Utilisation

```bash
nb scaffold <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Générer le squelette d'un plugin NocoBase |
| [`nb scaffold migration`](./migration.md) | Générer un script de migration de plugin |

## Exemples

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Commandes connexes

- [`nb plugin`](../plugin/index.md)
- [Développement de plugins](../../../plugin-development/index.md)
