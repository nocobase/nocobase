---
title: "nb app start"
description: "Référence de la commande nb app start : démarrer l'application NocoBase d'un env et, pour un env Docker, recréer le conteneur d'application à partir de la configuration enregistrée."
keywords: "nb app start,NocoBase CLI,démarrer l'application,Docker,pm2"
---

# nb app start

Démarrer l'application NocoBase de l'env indiqué. Une installation npm/Git exécute les commandes d'application locales ; une installation Docker recrée le conteneur d'application à partir de la configuration enregistrée de l'env.

## Utilisation

```bash
nb app start [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à démarrer ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--quickstart` | boolean | Démarrer rapidement l'application |
| `--port`, `-p` | string | Surcharger l'`appPort` défini dans la configuration de l'env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Lancer ou non en mode daemon, activé par défaut |
| `--instances`, `-i` | integer | Nombre d'instances à exécuter |
| `--launch-mode` | string | Mode de lancement : `pm2` ou `node` |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes locales ou Docker sous-jacentes |

## Exemples

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local --verbose
nb app start --env local-docker
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

Par défaut, les envs locales démarrent en arrière-plan et les envs Docker recréent le conteneur d'application à partir de la configuration enregistrée de l'env. Chaque fois que la CLI doit attendre que l'application soit prête, elle vérifie `__health_check` : elle affiche d'abord une ligne d'attente, puis une ligne de progression toutes les 10 secondes jusqu'à ce que l'application soit disponible ou que le délai soit dépassé.

Si vous passez `--no-daemon` pour une env locale, l'application s'exécute au premier plan. Dans ce cas, la CLI n'attend pas davantage la vérification de disponibilité après le démarrage.

## Commandes connexes

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
