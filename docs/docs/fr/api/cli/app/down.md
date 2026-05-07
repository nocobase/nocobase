---
title: "nb app down"
description: "Référence de la commande nb app down : arrêter et nettoyer les ressources d'exécution locales d'un env."
keywords: "nb app down,NocoBase CLI,nettoyer les ressources,supprimer un conteneur,storage"
---

# nb app down

Arrêter et nettoyer les ressources d'exécution locales de l'env indiqué. Par défaut, les données de storage et la configuration de l'env sont conservées ; pour tout supprimer, vous devez passer explicitement `--all --yes`.

## Utilisation

```bash
nb app down [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à nettoyer ; utilise l'env courant si omis |
| `--all` | boolean | Supprimer tout le contenu de l'env, y compris les données de storage et la configuration de l'env enregistrée |
| `--yes`, `-y` | boolean | Ignorer la confirmation des opérations destructives, généralement combiné avec `--all` |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes d'arrêt et de nettoyage sous-jacentes |

## Exemples

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Commandes connexes

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
