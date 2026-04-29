---
title: "nb db stop"
description: "Référence de la commande nb db stop : arrêter le conteneur de la base de données intégrée d'un env."
keywords: "nb db stop,NocoBase CLI,arrêter la base,Docker"
---

# nb db stop

Arrêter le conteneur de la base de données intégrée pour l'env indiqué. Cette commande ne s'applique qu'aux env qui activent une base intégrée hébergée par le CLI.

## Utilisation

```bash
nb db stop [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI dont arrêter la base intégrée ; utilise l'env courant si omis |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes Docker sous-jacentes |

## Exemples

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Commandes connexes

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
