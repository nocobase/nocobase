---
title: "nb app start"
description: "Référence de la commande nb app start : démarrer l'application NocoBase ou le conteneur Docker d'un env."
keywords: "nb app start,NocoBase CLI,démarrer l'application,Docker,pm2"
---

# nb app start

Démarrer l'application NocoBase de l'env indiqué. Une installation npm/Git exécute les commandes d'application locales ; une installation Docker démarre le conteneur d'application enregistré.

## Utilisation

```bash
nb app start [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à démarrer ; utilise l'env courant si omis |
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
nb app start --env local-docker
```

## Commandes connexes

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
