---
title: 'nb db stop'
description: "Référence de la commande nb db stop : arrête le conteneur de base de données intégré pour l'env spécifié."
keywords: 'nb db stop,NocoBase CLI,arrêter la base de données,Docker'
---

# nb db stop

Arrête le conteneur de base de données intégré pour l'env spécifié. Cette commande s'applique uniquement aux envs pour lesquels la base de données intégrée gérée par la CLI est activée.

## Utilisation

```bash
nb db stop [flags]
```

## Paramètres

| Paramètre     | Type    | Description                                                                                             |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nom de l'env CLI dont la base de données intégrée doit être arrêtée ; si omis, l'env actuel est utilisé |
| `--verbose`   | boolean | Affiche la sortie de la commande Docker sous-jacente                                                    |

## Exemples

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Commandes associées

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
