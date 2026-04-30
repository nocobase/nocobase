---
title: "nb db ps"
description: "Référence de la commande nb db ps : consulter l'état d'exécution de la base de données intégrée des env configurés."
keywords: "nb db ps,NocoBase CLI,état de la base"
---

# nb db ps

Consulter l'état d'exécution de la base intégrée. La commande ne démarre ni n'arrête aucune ressource. En l'absence de `--env`, elle affiche l'état pour tous les env configurés.

## Utilisation

```bash
nb db ps [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à consulter ; affiche tous les env si omis |

## Exemples

```bash
nb db ps
nb db ps --env app1
```

## Commandes connexes

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
