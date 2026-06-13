---
title: "nb app start"
description: "Référence de la commande nb app start : démarrer l'application NocoBase d'un env ; lorsque c'est applicable, la CLI synchronise d'abord les plugins commerciaux autorisés par la licence actuelle, puis, pour les envs locales, la préparation d'installation ou de mise à niveau est effectuée automatiquement avant le démarrage, et pour un env Docker, le conteneur d'application est recréé à partir de la configuration enregistrée."
keywords: "nb app start,NocoBase CLI,démarrer l'application,Docker,pm2"
---

# nb app start

Démarrer l'application NocoBase de l'env indiqué. Lorsque c'est applicable, la CLI synchronise d'abord les plugins commerciaux autorisés par la licence actuelle. Ensuite, une installation npm/Git prépare automatiquement l'installation ou la mise à niveau nécessaire avant d'exécuter les commandes d'application locales ; une installation Docker recrée le conteneur d'application à partir de la configuration enregistrée de l'env.

## Utilisation

```bash
nb app start [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à démarrer ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes locales ou Docker sous-jacentes |

## Exemples

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

Par défaut, lorsque c'est applicable, la CLI exécute d'abord `nb license plugins sync --skip-if-no-license` afin de synchroniser les plugins commerciaux autorisés par la licence actuelle. Ensuite, les envs locales effectuent automatiquement la préparation d'installation ou de mise à niveau nécessaire avant de démarrer en arrière-plan, et les envs Docker recréent le conteneur d'application à partir de la configuration enregistrée de l'env. Chaque fois que la CLI doit attendre que l'application soit prête, elle vérifie `__health_check` : elle affiche d'abord une ligne d'attente, puis une ligne de progression toutes les 10 secondes jusqu'à ce que l'application soit disponible ou que le délai soit dépassé.
## Commandes connexes

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
