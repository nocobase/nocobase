---
title: "nb init"
description: "Référence de la commande nb init : initialiser NocoBase, connecter une application existante ou installer une nouvelle application, puis l'enregistrer comme env CLI."
keywords: "nb init,NocoBase CLI,initialisation,env,Docker,npm,Git"
---

# nb init

Initialiser l'espace de travail courant pour qu'un coding agent puisse se connecter à NocoBase et l'utiliser. `nb init` permet aussi bien de connecter une application existante que d'en installer une nouvelle via Docker, npm ou Git.

## Utilisation

```bash
nb init [flags]
```

## Description

`nb init` prend en charge trois modes d'invite :

- Mode par défaut : remplissage progressif dans le terminal.
- `--ui` : ouvre un formulaire dans le navigateur local pour suivre le parcours guidé.
- `--yes` : ignore les invites et utilise les valeurs par défaut. Ce mode requiert `--env <envName>` et crée toujours une nouvelle application locale.

Par défaut, `nb init` installe ou met à jour les NocoBase AI coding skills lors de l'initialisation ou de sa reprise. Si vous gérez les skills vous-même, ou si vous travaillez en CI ou hors ligne, utilisez `--skip-skills` pour ignorer cette étape.

Si l'initialisation est interrompue après l'enregistrement de la configuration de l'env, vous pouvez la reprendre avec `--resume` :

```bash
nb init --env app1 --resume
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Ignorer les invites et utiliser les flags ainsi que les valeurs par défaut |
| `--env`, `-e` | string | Nom de l'env pour cette initialisation, requis avec `--yes` et `--resume` |
| `--ui` | boolean | Ouvrir l'assistant visuel dans le navigateur, incompatible avec `--yes` |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes |
| `--skip-skills` | boolean | Ignorer l'installation ou la mise à jour des NocoBase AI coding skills pendant l'initialisation |
| `--ui-host` | string | Adresse de bind du service local pour `--ui`, par défaut `127.0.0.1` |
| `--ui-port` | integer | Port du service local pour `--ui`, `0` pour une attribution automatique |
| `--locale` | string | Langue des messages CLI et de l'UI : `en-US` ou `zh-CN` |
| `--api-base-url`, `-u` | string | Adresse de l'API NocoBase, incluant le préfixe `/api` |
| `--auth-type`, `-a` | string | Méthode d'authentification : `token` ou `oauth` |
| `--access-token`, `-t` | string | API key ou access token utilisé par la méthode `token` |
| `--resume` | boolean | Réutiliser la configuration d'env enregistrée dans le workspace pour reprendre l'initialisation |
| `--lang`, `-l` | string | Langue de l'application NocoBase après installation |
| `--force`, `-f` | boolean | Reconfigurer un env existant et remplacer si nécessaire les ressources runtime en conflit |
| `--app-root-path` | string | Répertoire des sources locales d'application npm/Git, par défaut `./<envName>/source/` |
| `--app-port` | string | Port de l'application locale, par défaut `13000`. En mode `--yes`, un port disponible est sélectionné automatiquement |
| `--storage-path` | string | Répertoire des fichiers téléversés et des données de la base hébergée, par défaut `./<envName>/storage/` |
| `--root-username` | string | Nom d'utilisateur de l'administrateur initial |
| `--root-email` | string | E-mail de l'administrateur initial |
| `--root-password` | string | Mot de passe de l'administrateur initial |
| `--root-nickname` | string | Pseudo de l'administrateur initial |
| `--builtin-db`, `--no-builtin-db` | boolean | Créer ou non la base de données intégrée gérée par le CLI |
| `--db-dialect` | string | Type de base : `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Image du conteneur de la base de données intégrée |
| `--db-host` | string | Hôte de la base de données |
| `--db-port` | string | Port de la base de données |
| `--db-database` | string | Nom de la base de données |
| `--db-user` | string | Utilisateur de la base de données |
| `--db-password` | string | Mot de passe de la base de données |
| `--fetch-source` | boolean | Télécharger les fichiers de l'application ou récupérer l'image Docker avant l'installation |
| `--source`, `-s` | string | Mode d'obtention de NocoBase : `docker`, `npm` ou `git` |
| `--version`, `-v` | string | Version : version npm, tag d'image Docker ou ref Git |
| `--replace`, `-r` | boolean | Remplacer le répertoire cible s'il existe déjà |
| `--dev-dependencies`, `-D` | boolean | Installer les devDependencies lors d'une installation npm/Git |
| `--output-dir`, `-o` | string | Répertoire de destination du téléchargement, ou répertoire où enregistrer le tarball Docker |
| `--git-url` | string | URL du dépôt Git |
| `--docker-registry` | string | Nom du registry d'image Docker, sans le tag |
| `--docker-platform` | string | Plateforme de l'image Docker : `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Enregistrer ou non l'image Docker comme tarball après récupération |
| `--npm-registry` | string | Registry npm utilisé pour les téléchargements et l'installation des dépendances npm/Git |
| `--build`, `--no-build` | boolean | Lancer la build après l'installation des dépendances npm/Git |
| `--build-dts` | boolean | Générer les fichiers de déclaration TypeScript lors de la build npm/Git |

## Exemples

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Commandes connexes

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
