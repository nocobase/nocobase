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
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |

## Exemples

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
nb plugin enable -e local --yes @nocobase/plugin-sample
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
