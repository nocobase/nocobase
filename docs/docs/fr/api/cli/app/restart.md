---
title: "nb app restart"
description: "Référence de la commande nb app restart : redémarrer l'application NocoBase ou le conteneur Docker d'un env."
keywords: "nb app restart,NocoBase CLI,redémarrer l'application,Docker"
---

# nb app restart

Arrêter puis redémarrer l'application NocoBase de l'env indiqué.

## Utilisation

```bash
nb app restart [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à redémarrer ; utilise l'env courant si omis |
| `--quickstart` | boolean | Démarrer rapidement l'application après l'arrêt |
| `--port`, `-p` | string | Surcharger l'`appPort` défini dans la configuration de l'env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Lancer ou non en mode daemon après l'arrêt, activé par défaut |
| `--instances`, `-i` | integer | Nombre d'instances à exécuter après l'arrêt |
| `--launch-mode` | string | Mode de lancement : `pm2` ou `node` |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes d'arrêt et de démarrage sous-jacentes |

## Exemples

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## Commandes connexes

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
