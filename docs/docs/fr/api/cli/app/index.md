---
title: 'nb app'
description: "Référence de la commande nb app : gérez le runtime de l'application NocoBase, y compris le démarrage, l'arrêt, le redémarrage, les journaux et la mise à niveau."
keywords: 'nb app,NocoBase CLI,démarrer,arrêter,redémarrer,journaux,mise à niveau'
---

# nb app

Gère le runtime de l'application NocoBase. Dans npm/Git env, les commandes de l'application sont exécutées dans le répertoire local du code source ; dans Docker env, les conteneurs de l'application sont gérés à partir de la configuration enregistrée.

## Utilisation

```bash
nb app <command>
```

## Sous-commandes

| Commande                         | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Démarre l'application ou recrée le conteneur Docker                         |
| [`nb app stop`](./stop.md)       | Arrête l'application ou nettoie le conteneur Docker                         |
| [`nb app restart`](./restart.md) | Arrête d'abord l'application, puis la redémarre                             |
| [`nb app autostart`](./autostart/index.md) | Gère les marqueurs de démarrage automatique et démarre tous les envs activés |
| [`nb app logs`](./logs.md)       | Affiche les journaux de l'application                                       |
| [`nb app upgrade`](./upgrade.md) | Arrête l'application, remplace le code source ou l'image, puis la redémarre |

## Exemples

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Commandes associées

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
