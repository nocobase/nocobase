---
title: 'nb app stop'
description: 'Référence de la commande nb app stop : arrête l’application NocoBase de l’env spécifié et, si nécessaire, nettoie également le conteneur de base de données intégrée géré par la CLI.'
keywords: "nb app stop,NocoBase CLI,arrêter l'application,Docker,with-db,base de données intégrée"
---

# nb app stop

Arrête l’application NocoBase de l’env spécifié. Pour les installations npm/Git, cela arrête le processus local de l’application ; pour les installations Docker, cela nettoie le conteneur d’application enregistré.

Si vous passez `--with-db` et que cet env utilise une base de données intégrée gérée par la CLI, la commande nettoiera également le conteneur de base de données. Si cet env utilise une base de données externe, les ressources de base de données ne seront pas touchées.

## Utilisation

```bash
nb app stop [flags]
```

## Paramètres

| Paramètre     | Type    | Description                                                                                                     |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nom de l’env CLI à arrêter ; utilise l’env courant s’il est omis                                                |
| `--yes`, `-y` | boolean | Ignore la confirmation interactive lorsque l’env explicitement ciblé par `--env` est différent de l’env courant |
| `--with-db`   | boolean | Nettoie également le conteneur de base de données lorsqu’une base de données intégrée gérée par la CLI existe   |
| `--verbose`   | boolean | Affiche la sortie des commandes locales ou Docker sous-jacentes                                                 |

## Exemples

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Remarques

La CLI vérifie si l’env spécifié correspond à l’env courant uniquement lorsque vous passez explicitement `--env`. Si vous spécifiez explicitement un env différent, un terminal interactif demandera d’abord une confirmation ; dans un terminal non interactif ou dans un scénario d’agent IA, vous devez ajouter explicitement `--yes` vous-même, ou exécuter d’abord `nb env use <name>` puis réessayer.

`--with-db` n’affecte que les conteneurs de base de données intégrée gérés par la CLI. En général, si vous voulez seulement arrêter l’application elle-même, vous n’avez pas besoin de ce paramètre ; ajoutez-le uniquement si vous voulez aussi arrêter l’environnement d’exécution de la base de données intégrée sur la machine actuelle.

Cette commande ne peut agir que sur les runtimes local ou Docker de la machine actuelle. Si un env n’est qu’une connexion d’API HTTP, ou s’il s’agit d’un env SSH réservé, `nb app stop` ne peut pas l’arrêter à distance pour vous.

## Commandes associées

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
