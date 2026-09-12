---
title: "nb app autostart"
description: "Référence du groupe de commandes nb app autostart : activez ou désactivez le démarrage automatique pour les envs locaux ou Docker, puis démarrez tous les envs activés en une seule fois."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Gère les paramètres de démarrage automatique de l'application.

Ce groupe de commandes couvre deux types de tâches :

- activer ou désactiver le marqueur de démarrage automatique pour un env
- démarrer tous les envs qui ont déjà le démarrage automatique activé

`nb app autostart` s’applique uniquement aux envs disposant d’un runtime géré par la CLI sur la machine actuelle, à savoir `local` et `docker`. Si un env n’est qu’une connexion API distante, ou s’il ne s’agit pas d’un runtime d’application géré par la CLI et démarrable sur cette machine, il ne peut pas faire partie de ce flux de démarrage automatique.

## Utilisation

```bash
nb app autostart <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Active le marqueur de démarrage automatique pour un env |
| [`nb app autostart disable`](./disable.md) | Désactive le marqueur de démarrage automatique pour un env |
| [`nb app autostart list`](./list.md) | Affiche l’état de démarrage automatique de tous les envs |
| [`nb app autostart run`](./run.md) | Démarre tous les envs dont le démarrage automatique est activé |

## Notes

`nb app autostart enable` se contente de marquer un env comme autorisé à démarrer automatiquement. Il ne l’intègre pas à lui seul dans le processus de démarrage du système. Dans une configuration de production réelle, vous devez généralement appeler `nb app autostart run` depuis votre propre mécanisme de démarrage hôte, comme `systemd`, un script de démarrage de plateforme de conteneurs ou un autre processus de boot déjà en place.

De plus, `nb app autostart run` vérifie chaque env activé un par un. Les envs qui peuvent démarrer continuent via `nb app start --env <name> --yes`. Les envs qui ne devraient pas être démarrés automatiquement sur la machine actuelle apparaissent comme `skipped` ou `failed` dans le tableau de résultats.

## Exemples

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Commandes associées

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
