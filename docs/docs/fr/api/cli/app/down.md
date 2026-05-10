---
title: "nb app down"
description: "Référence de la commande nb app down : arrêter et nettoyer les ressources d'exécution locales d'un env."
keywords: "nb app down,NocoBase CLI,nettoyer les ressources,supprimer un conteneur,storage"
---

# nb app down

Arrêter et nettoyer les ressources d'exécution locales de l'env indiqué. Par défaut, les données de storage et la configuration de l'env sont conservées ; pour tout supprimer, vous devez passer explicitement `--all --force`.

## Utilisation

```bash
nb app down [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à nettoyer ; utilise l'env courant si omis |
| `--all` | boolean | Supprimer tout le contenu de l'env, y compris les données de storage et la configuration de l'env enregistrée |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--force`, `-f` | boolean | Force un nettoyage destructif, comme `--all` ou d'autres nettoyages à haut risque en mode non interactif |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes d'arrêt et de nettoyage sous-jacentes |

## Exemples

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` ne fait qu'ignorer la confirmation interactive lorsqu'un `--env` passé explicitement cible une env différente de l'env actuelle. `--force` sert à réellement forcer un nettoyage destructif, par exemple avec `--all` ou d'autres nettoyages à haut risque en mode non interactif.

## Commandes connexes

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
