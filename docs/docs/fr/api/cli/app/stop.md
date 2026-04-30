---
title: "nb app stop"
description: "Référence de la commande nb app stop : arrêter l'application NocoBase ou le conteneur Docker d'un env."
keywords: "nb app stop,NocoBase CLI,arrêter l'application,Docker"
---

# nb app stop

Arrêter l'application NocoBase de l'env indiqué. Une installation npm/Git arrête le processus d'application local ; une installation Docker arrête le conteneur d'application enregistré.

## Utilisation

```bash
nb app stop [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à arrêter ; utilise l'env courant si omis |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes locales ou Docker sous-jacentes |

## Exemples

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Commandes connexes

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
