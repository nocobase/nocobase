---
title: "nb db"
description: "Référence de la commande nb db : consulter ou gérer l'état d'exécution de la base de données intégrée de l'env sélectionné."
keywords: "nb db,NocoBase CLI,base de données intégrée,Docker,état de la base"
---

# nb db

Consulter ou gérer la base de données intégrée hébergée par le CLI. Pour les env qui n'ont pas de conteneur de base hébergé par le CLI, `nb db ps` affichera des états comme `external` ou `remote`.

## Utilisation

```bash
nb db <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb db ps`](./ps.md) | Consulter l'état d'exécution de la base intégrée |
| [`nb db start`](./start.md) | Démarrer le conteneur de la base intégrée |
| [`nb db stop`](./stop.md) | Arrêter le conteneur de la base intégrée |
| [`nb db logs`](./logs.md) | Consulter les logs du conteneur de la base intégrée |

## Exemples

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Commandes connexes

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
