---
title: "nb plugin"
description: "Référence de la commande nb plugin : gérer les plugins de l'env NocoBase sélectionné."
keywords: "nb plugin,NocoBase CLI,gestion des plugins,enable,disable,list"
---

# nb plugin

Gérer les plugins de l'env NocoBase sélectionné. Pour un env npm/Git, les commandes plugin sont exécutées localement ; pour un env Docker, elles sont exécutées dans le conteneur d'application enregistré ; pour un env HTTP, elles retombent sur l'API quand celle-ci est disponible.

## Utilisation

```bash
nb plugin <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb plugin list`](./list.md) | Lister les plugins installés |
| [`nb plugin enable`](./enable.md) | Activer un ou plusieurs plugins |
| [`nb plugin disable`](./disable.md) | Désactiver un ou plusieurs plugins |

## Exemples

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Commandes connexes

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
