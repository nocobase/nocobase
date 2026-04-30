---
title: "nb plugin disable"
description: "Référence de la commande nb plugin disable : désactiver un ou plusieurs plugins dans l'env NocoBase sélectionné."
keywords: "nb plugin disable,NocoBase CLI,désactiver un plugin"
---

# nb plugin disable

Désactiver un ou plusieurs plugins dans l'env sélectionné.

## Utilisation

```bash
nb plugin disable <packages...> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<packages...>` | string[] | Noms de packages des plugins, requis ; plusieurs valeurs acceptées |
| `--env`, `-e` | string | Nom de l'env CLI ; utilise l'env courant si omis |

## Exemples

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
```

## Commandes connexes

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
