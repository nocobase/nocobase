---
title: "nb db start"
description: "Référence de la commande nb db start : démarrer le conteneur de la base de données intégrée d'un env."
keywords: "nb db start,NocoBase CLI,démarrer la base,Docker"
---

# nb db start

Démarrer le conteneur de la base de données intégrée pour l'env indiqué. Cette commande ne s'applique qu'aux env qui activent une base intégrée hébergée par le CLI.

## Utilisation

```bash
nb db start [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI dont démarrer la base intégrée ; utilise l'env courant si omis |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes Docker sous-jacentes |

## Exemples

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Commandes connexes

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
