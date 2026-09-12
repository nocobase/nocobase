---
title: 'NocoBase CLI'
description: "Référence de NocoBase CLI (commande nb) : initialisation, sauvegarde et restauration, configuration, gestion de l'environnement, exécution de l'application, code source, base de données, plugins, licence commerciale, API, auto-mise à jour du CLI et gestion des Skills."
keywords: "NocoBase CLI,nb,ligne de commande,référence des commandes,sauvegarde,restauration,gestion de l'environnement,gestion des plugins,licence commerciale,API"
---

# NocoBase CLI

## Description

NocoBase CLI (`nb`) est le point d’entrée en ligne de commande de NocoBase, utilisé pour initialiser, connecter et gérer les applications NocoBase dans l’espace de travail local.

Il prend en charge deux parcours d’initialisation courants :

- Se connecter à une application NocoBase existante et l’enregistrer comme environnement CLI
- Installer une nouvelle application NocoBase via Docker, npm ou Git, puis l’enregistrer comme environnement CLI

Lors de la création d’une nouvelle application locale, [`nb init`](./init.md) peut également installer ou mettre à jour les skills de codage IA de NocoBase. Si vous devez ignorer cette étape, vous pouvez utiliser `--skip-skills`.

## Utilisation

```bash
nb [command]
```

La commande racine sert principalement à afficher l’aide et à répartir les appels vers des groupes de commandes ou des commandes autonomes.

## Groupes de commandes (Topics)

`nb --help` affiche les groupes de commandes suivants :

| Groupe de commandes                  | Description                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [`nb api`](./api/index.md)           | Appeler l’API NocoBase via le CLI.                                                                                       |
| [`nb app`](./app/index.md)           | Gérer l’état d’exécution de l’application : démarrer, arrêter, redémarrer, journaux et mise à niveau.                    |
| [`nb backup`](./backup/index.md)     | Créer une sauvegarde et la télécharger en local, ou restaurer un fichier de sauvegarde local vers l’environnement cible. |
| [`nb config`](./config/index.md)     | Gérer la configuration par défaut du CLI.                                                                                |
| [`nb db`](./db/index.md)             | Gérer la base de données intégrée de l’environnement sélectionné.                                                        |
| [`nb env`](./env/index.md)           | Gérer les environnements de projet NocoBase, l’environnement courant, l’état, les détails et les commandes d’exécution.  |
| [`nb license`](./license/index.md)   | Gérer la licence commerciale et les plugins sous licence.                                                                |
| [`nb plugin`](./plugin/index.md)     | Gérer les plugins de l’environnement NocoBase sélectionné.                                                               |
| [`nb scaffold`](./scaffold/index.md) | Générer le scaffold de développement de plugins NocoBase.                                                                |
| [`nb self`](./self/index.md)         | Vérifier ou mettre à jour NocoBase CLI lui-même.                                                                         |
| [`nb session`](./session/index.md)   | Configurer `NB_SESSION_ID` pour isoler l’environnement courant selon le shell ou l’environnement d’exécution de l’agent. |
| [`nb skills`](./skills/index.md)     | Vérifier ou synchroniser les skills de codage IA NocoBase de l’espace de travail actuel.                                 |
| [`nb source`](./source/index.md)     | Gérer le projet de code source local : téléchargement, développement, build et tests.                                    |

## Commandes (Commands)

Commandes autonomes actuellement exposées directement par la commande racine :

| Commande               | Description                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| [`nb init`](./init.md) | Initialiser NocoBase afin que l’agent de codage puisse se connecter et fonctionner. |

## Afficher l’aide

Afficher l’aide de la commande racine :

```bash
nb --help
```

Afficher l’aide d’une commande ou d’un groupe de commandes :

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## Exemples

Initialisation interactive :

```bash
nb init
```

Initialisation à l’aide d’un formulaire dans le navigateur :

```bash
nb init --ui
```

Créer une application Docker en mode non interactif :

```bash
nb init --env app1 --yes --source docker --version alpha
```

Se connecter à une application existante :

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

Resynchroniser l’état de l’environnement après le démarrage de l’application :

```bash
nb app start -e app1
nb env update app1
```

Appeler l’API :

```bash
nb api resource list --resource users -e app1
```

Afficher la configuration par défaut du CLI :

```bash
nb config list
nb config get docker.network
```

Afficher l’état de la licence commerciale :

```bash
nb license status -e app1
nb license plugins list -e app1
```

Créer et télécharger une sauvegarde :

```bash
nb backup create -e app1 --output ./backups
```

Restaurer une sauvegarde locale :

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Variables d’environnement

Les variables d’environnement suivantes affectent le comportement du CLI :

| Variable        | Description                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | Répertoire racine où le CLI enregistre la configuration `.nocobase` et les fichiers des applications locales. Par défaut, il s’agit du répertoire personnel de l’utilisateur courant. |
| `NB_LOCALE`     | Langue des invites du CLI et langue de l’interface d’initialisation locale, prend en charge `en-US` et `zh-CN`.                                                                       |
| `NB_SESSION_ID` | ID de session du shell actuel ou de l’environnement d’exécution de l’agent. Une fois défini, `nb env use` et `nb env current` sont isolés par session.                                |

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

Après avoir défini `NB_CLI_ROOT=/your/workspace`, le chemin du fichier de configuration devient :

```text
/your/workspace/.nocobase/config.json
```

Le CLI est également compatible avec la lecture de l’ancienne configuration de projet dans le répertoire de travail courant.

Le cache au niveau de la session pour l’environnement courant est enregistré dans :

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

Le dernier environnement utilisé globalement est enregistré dans le champ `lastEnv` de `config.json`. Sans `NB_SESSION_ID`, le CLI revient à cette valeur globale.

Le cache des commandes d’exécution est enregistré dans :

```text
.nocobase/versions/<hash>/commands.json
```

Ce fichier est généré ou actualisé par [`nb env update`](./env/update.md) et sert à mettre en cache les commandes d’exécution synchronisées depuis l’application cible.

## Liens associés

- [Démarrage rapide](../../ai/quick-start.mdx)
- [Variables d’environnement globales](../app/env.md)
- [Création avec l’IA](../../ai-builder/index.md)
- [Développement de plugins](../../plugin-development/index.md)
