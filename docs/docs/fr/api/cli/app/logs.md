---
title: "nb app logs"
description: "Référence de la commande nb app logs : consulter les logs de l'application NocoBase d'un env."
keywords: "nb app logs,NocoBase CLI,logs de l'application,Docker logs,pm2 logs"
---

# nb app logs

Consulter les logs de l'application. Une installation npm/Git lit les logs pm2 ; une installation Docker lit les logs du conteneur Docker.

## Utilisation

```bash
nb app logs [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI dont consulter les logs ; utilise l'env courant si omis |
| `--tail` | integer | Nombre de lignes récentes à afficher avant le suivi en continu, par défaut `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Suivre ou non les nouveaux logs en continu |

## Exemples

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Commandes connexes

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
