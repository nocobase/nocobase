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
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |

## Exemples

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
