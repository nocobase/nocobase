---
title: "nb app restart"
description: "Référence de la commande nb app restart : redémarrer l'application NocoBase d'un env ; lorsque c'est applicable, la CLI synchronise d'abord les plugins commerciaux autorisés par la licence actuelle, puis, pour les envs locales, la préparation d'installation ou de mise à niveau est effectuée automatiquement pendant le redémarrage, et pour un env Docker, le conteneur d'application est recréé à partir de la configuration enregistrée."
keywords: "nb app restart,NocoBase CLI,redémarrer l'application,Docker"
---

# nb app restart

Arrêter puis redémarrer l'application NocoBase de l'env indiqué. Lorsque c'est applicable, la CLI synchronise d'abord les plugins commerciaux autorisés par la licence actuelle. Ensuite, les envs locales réutilisent le flux de `nb app stop` et `nb app start` et, par défaut, préparent automatiquement l'installation ou la mise à niveau nécessaire avant de repartir ; les envs Docker suppriment d'abord le conteneur actuel, puis recréent le conteneur d'application à partir de la configuration enregistrée de l'env.

## Utilisation

```bash
nb app restart [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à redémarrer ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes d'arrêt et de démarrage sous-jacentes |

## Exemples

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

Par défaut, lorsque c'est applicable, la CLI exécute d'abord `nb license plugins sync --skip-if-no-license` afin de synchroniser les plugins commerciaux autorisés par la licence actuelle. Ensuite, les envs locales effectuent automatiquement la préparation d'installation ou de mise à niveau nécessaire avant de redémarrer, et les envs Docker réalisent cette étape avant de recréer le conteneur. Chaque fois que la CLI doit attendre que l'application soit prête, elle vérifie `__health_check` : elle affiche d'abord une ligne d'attente, puis une ligne de progression toutes les 10 secondes jusqu'à ce que l'application soit disponible ou que le délai soit dépassé.

## Scripts hook

Si l’env courant a enregistré un hook avec `nb init --hook-script`, `nb app restart` exécute une fois `afterAppStart(context)` après le redémarrage de l’app et la réussite de `__health_check`. Il utilise `context.phase = 'app-start'` et `context.command = 'app:restart'`.

## Commandes connexes

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
