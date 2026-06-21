---
title: "nb db logs"
description: "Référence de la commande nb db logs : consulter les logs du conteneur de la base de données intégrée d'un env."
keywords: "nb db logs,NocoBase CLI,logs de la base,Docker logs"
---

# nb db logs

Consulter les logs du conteneur de la base de données intégrée pour l'env indiqué. Cette commande ne s'applique qu'aux env qui activent une base intégrée hébergée par le CLI.

## Utilisation

```bash
nb db logs [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI dont consulter les logs de base ; utilise l'env courant si omis |
| `--tail` | integer | Nombre de lignes récentes à afficher avant le suivi en continu, par défaut `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Suivre ou non les nouveaux logs en continu |

## Exemples

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Commandes connexes

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
