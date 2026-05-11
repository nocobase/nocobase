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
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |

## Exemples

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
