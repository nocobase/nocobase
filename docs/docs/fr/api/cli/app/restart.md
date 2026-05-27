---
title: "nb app restart"
description: "Référence de la commande nb app restart : redémarrer l'application NocoBase d'un env et, pour un env Docker, recréer le conteneur d'application à partir de la configuration enregistrée."
keywords: "nb app restart,NocoBase CLI,redémarrer l'application,Docker"
---

# nb app restart

Arrêter puis redémarrer l'application NocoBase de l'env indiqué. Les envs locales réutilisent le flux de `nb app stop` et `nb app start` ; les envs Docker suppriment d'abord le conteneur actuel, puis recréent le conteneur d'application à partir de la configuration enregistrée de l'env.

## Utilisation

```bash
nb app restart [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à redémarrer ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
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
nb app restart --env local --verbose
nb app restart --env local-docker
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

Chaque fois que la CLI doit attendre que l'application soit prête, elle vérifie `__health_check` : elle affiche d'abord une ligne d'attente, puis une ligne de progression toutes les 10 secondes jusqu'à ce que l'application soit disponible ou que le délai soit dépassé. Si vous passez `--no-daemon` pour une env locale, l'application s'exécute au premier plan, donc la CLI n'attend pas davantage la vérification de disponibilité après le démarrage.

## Commandes connexes

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
