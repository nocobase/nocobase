---
title: "nb plugin enable"
description: "Référence de la commande nb plugin enable : activer un ou plusieurs plugins dans l'env NocoBase sélectionné."
keywords: "nb plugin enable,NocoBase CLI,activer un plugin"
---

# nb plugin enable

Activer un ou plusieurs plugins dans l'env sélectionné.

## Utilisation

```bash
nb plugin enable <packages...> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<packages...>` | string[] | Noms de packages des plugins, requis ; plusieurs valeurs acceptées |
| `--env`, `-e` | string | Nom de l'env CLI ; utilise l'env courant si omis |

## Exemples

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## Commandes connexes

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
