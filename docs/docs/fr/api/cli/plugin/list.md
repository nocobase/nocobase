---
title: "nb plugin list"
description: "Référence de la commande nb plugin list : lister les plugins de l'env NocoBase sélectionné."
keywords: "nb plugin list,NocoBase CLI,liste des plugins"
---

# nb plugin list

Lister les plugins installés dans l'env sélectionné.

## Utilisation

```bash
nb plugin list [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; utilise l'env courant si omis |

## Exemples

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Commandes connexes

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
