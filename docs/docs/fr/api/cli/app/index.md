---
title: "nb app"
description: "Référence de la commande nb app : gérer l'état d'exécution d'une application NocoBase, dont le démarrage, l'arrêt, le redémarrage, les logs, le nettoyage et la mise à niveau."
keywords: "nb app,NocoBase CLI,démarrer,arrêter,redémarrer,logs,mise à niveau"
---

# nb app

Gérer l'état d'exécution d'une application NocoBase. Pour un env npm/Git, les commandes d'application sont exécutées dans le répertoire des sources locales ; pour un env Docker, elles agissent sur le conteneur d'application enregistré.

## Utilisation

```bash
nb app <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb app start`](./start.md) | Démarrer l'application ou le conteneur Docker |
| [`nb app stop`](./stop.md) | Arrêter l'application ou le conteneur Docker |
| [`nb app restart`](./restart.md) | Arrêter puis redémarrer l'application |
| [`nb app logs`](./logs.md) | Consulter les logs de l'application |
| [`nb app down`](./down.md) | Arrêter et nettoyer les ressources d'exécution locales |
| [`nb app upgrade`](./upgrade.md) | Mettre à jour les sources ou l'image et redémarrer l'application |

## Exemples

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Commandes connexes

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
