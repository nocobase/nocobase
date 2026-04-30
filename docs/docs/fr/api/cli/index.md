---
title: "NocoBase CLI"
description: "Référence du NocoBase CLI (commande nb) : initialisation, gestion des environnements, exécution de l'application, sources, base de données, plugins, API, mise à jour automatique du CLI et gestion des Skills."
keywords: "NocoBase CLI,nb,ligne de commande,référence des commandes,gestion des environnements,gestion des plugins,API"
---

# NocoBase CLI

## Description

Le NocoBase CLI (`nb`) est le point d'entrée en ligne de commande de NocoBase. Il vous permet d'initialiser, de connecter et de gérer vos applications NocoBase depuis votre espace de travail local.

Il prend en charge deux parcours d'initialisation courants :

- Connecter une application NocoBase existante et l'enregistrer comme env CLI
- Installer une nouvelle application NocoBase via Docker, npm ou Git, puis l'enregistrer comme env CLI

Lors de la création d'une nouvelle application locale, [`nb init`](./init.md) peut également installer ou mettre à jour les NocoBase AI coding skills. Si vous souhaitez ignorer cette étape, utilisez `--skip-skills`.

## Utilisation

```bash
nb [command]
```

La commande racine sert principalement à afficher l'aide et à acheminer les appels vers les groupes de commandes ou les commandes autonomes.

## Groupes de commandes (Topics)

`nb --help` affiche les groupes de commandes suivants :

| Groupe de commandes | Description |
| --- | --- |
| [`nb api`](./api/index.md) | Appeler l'API NocoBase via le CLI. |
| [`nb app`](./app/index.md) | Gérer l'état d'exécution de l'application : démarrer, arrêter, redémarrer, consulter les logs et mettre à niveau. |
| [`nb db`](./db/index.md) | Gérer la base de données intégrée de l'env sélectionné. |
| [`nb env`](./env/index.md) | Gérer les environnements de projet NocoBase, leur état, leurs détails et leurs commandes runtime. |
| [`nb plugin`](./plugin/index.md) | Gérer les plugins de l'env NocoBase sélectionné. |
| [`nb scaffold`](./scaffold/index.md) | Générer des squelettes pour le développement de plugins NocoBase. |
| [`nb self`](./self/index.md) | Vérifier ou mettre à jour le NocoBase CLI lui-même. |
| [`nb skills`](./skills/index.md) | Vérifier ou synchroniser les NocoBase AI coding skills de l'espace de travail courant. |
| [`nb source`](./source/index.md) | Gérer le projet source local : télécharger, développer, construire et tester. |

## Commandes (Commands)

Commandes autonomes exposées directement par la commande racine :

| Commande | Description |
| --- | --- |
| [`nb init`](./init.md) | Initialiser NocoBase pour qu'un coding agent puisse s'y connecter et travailler. |

## Consulter l'aide

Afficher l'aide de la commande racine :

```bash
nb --help
```

Afficher l'aide d'une commande ou d'un groupe de commandes spécifique :

```bash
nb init --help
nb app --help
nb api resource --help
```

## Exemples

Initialisation interactive :

```bash
nb init
```

Initialisation via un formulaire dans le navigateur :

```bash
nb init --ui
```

Créer une application Docker en mode non interactif :

```bash
nb init --env app1 --yes --source docker --version alpha
```

Connecter une application existante :

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Démarrer l'application et rafraîchir les commandes runtime :

```bash
nb app start -e app1
nb env update app1
```

Appeler l'API :

```bash
nb api resource list --resource users -e app1
```

## Variables d'environnement

Les variables d'environnement suivantes influent sur le comportement du CLI :

| Variable | Description |
| --- | --- |
| `NB_CLI_ROOT` | Répertoire racine où le CLI enregistre la configuration `.nocobase` et les fichiers d'application locaux. Par défaut, le répertoire personnel de l'utilisateur courant. |
| `NB_LOCALE` | Langue des messages CLI et de l'interface d'initialisation locale. Valeurs prises en charge : `en-US` et `zh-CN`. |

Exemple :

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Fichier de configuration

Fichier de configuration par défaut :

```text
~/.nocobase/config.json
```

Si vous définissez `NB_CLI_ROOT=/your/workspace`, le chemin du fichier de configuration devient :

```text
/your/workspace/.nocobase/config.json
```

Le CLI sait également lire les anciennes configurations de projet présentes dans le répertoire de travail courant.

Le cache des commandes runtime est enregistré dans :

```text
.nocobase/versions/<hash>/commands.json
```

Ce fichier est généré ou rafraîchi par [`nb env update`](./env/update.md) et sert à mettre en cache les commandes runtime synchronisées depuis l'application cible.

## Liens connexes

- [Démarrage rapide](../../ai/quick-start.mdx)
- [Installation, mise à niveau et migration](../../ai/install-upgrade-migration.mdx)
- [Variables d'environnement globales](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Développement de plugins](../../plugin-development/index.md)
