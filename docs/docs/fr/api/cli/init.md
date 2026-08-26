---
title: 'nb init'
description: 'Référence de la commande nb init : nouvelle installation, prise en charge d’une application existante sur la machine ou connexion à une application distante, puis enregistrement comme CLI env.'
keywords: 'nb init,NocoBase CLI,initialisation,env,Docker,npm,Git,connexion distante'
---

# nb init

Initialise l’espace de travail actuel pour que le coding agent puisse se connecter à NocoBase et l’utiliser.

`nb init` peut installer une nouvelle application NocoBase locale, ou enregistrer les informations de connexion d’une application existante.

De plus, `nb init` synchronise aussi par défaut les NocoBase AI coding skills. Vous n’avez besoin d’ajouter `--skip-skills` que si vous gérez déjà les skills vous-même, ou si vous l’exécutez dans un environnement CI ou hors ligne.

## Utilisation

```bash
nb init [flags]
```

## Mode interactif

`nb init` prend en charge trois modes d’interaction :

- `nb init` : termine l’assistant pas à pas dans le terminal
- `nb init --ui` : ouvre un formulaire dans le navigateur local et termine le setup avec un assistant visuel
- `nb init --yes --env app1` : ignore les invites et utilise directement les flags ; les paramètres non explicitement fournis seront traités avec leurs valeurs par défaut

Le mode `--yes` convient aux scripts, au CI/CD ou à d’autres scénarios non interactifs. Dans ce mode, `--env <envName>` est obligatoire. En règle générale, il installe par défaut une nouvelle application locale ; si vous ne spécifiez pas `--source`, `docker` sera utilisé par défaut comme source d’installation.

## Reprendre une initialisation interrompue

Les flux d’installation enregistrent d’abord la configuration de l’env, puis exécutent le téléchargement, la base de données et l’installation de l’application. En cas d’échec en cours de route, vous pouvez reprendre :

```bash
nb init --env app1 --resume
```

`--resume` s’applique uniquement aux flux d’initialisation dont la configuration de l’env a déjà été enregistrée, et `--env` doit être fourni explicitement.

## Préparer d’abord l’env et installer l’app plus tard

`--prepare-only` est conçu pour les flux où l’on prépare d’abord l’env, puis on active la licence, et seulement ensuite on installe et on démarre l’app.

Si vous voulez d’abord enregistrer la configuration de l’env, préparer les fichiers source ou l’image, et mettre la base de données en place, tout en reportant l’installation réelle de l’app et son premier démarrage, vous pouvez utiliser :

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Ce mode est disponible pour les flux d’installation locale, y compris l’assistant `--ui`. Il n’est pas disponible pour les flux de connexion distante. La CLI enregistre l’env actuel à l’état prepared, ce qui vous permet de reprendre plus tard avec un flux comme celui-ci :

```bash
nb license activate --env app1
nb app start --env app1
```

Ensuite, `nb app start` terminera la première installation et fera passer l’env de l’état prepared à l’état normal installed.

## À propos du répertoire d’installation

Vous pouvez afficher le chemin complet avec `nb env info app1 --field app.appPath`.

Par défaut, la CLI organise les fichiers locaux sous `app-path` selon cette convention :

```text
<app-path>/
├── source/   # répertoire par défaut correspondant au code source de l’application ou au contenu téléchargé
├── storage/  # répertoire des données d’exécution
└── .env      # fichier facultatif de variables d’environnement de l’application
```

En règle générale :

- `source/` correspond principalement au répertoire local de l’application pour les env npm / Git. Pour les env Docker, la CLI conserve aussi cette logique de chemin par défaut, mais dans la plupart des cas vous n’avez pas besoin de vous en préoccuper manuellement. Faites particulièrement attention lors des mises à niveau : le répertoire `source/` sera supprimé puis téléchargé à nouveau. N’y placez donc pas de fichiers à conserver
- `storage/` sert à stocker les données d’exécution, comme les données de la base embarquée, les plugins, les journaux, etc.
- `.env` est un fichier facultatif de variables d’environnement de l’application. Vous n’avez besoin de l’ajouter dans `<app-path>/.env` que si vous souhaitez personnaliser des variables d’environnement ; si ce fichier existe, les sources d’installation Docker, npm et Git le liront par défaut

Cela représente la convention de répertoires par défaut de la CLI. Selon la source d’installation, les plugins et l’étape d’exécution, le contenu réel généré dans le répertoire peut ne pas être exactement identique.

## Remarques

:::warning Attention

- `--ui` ne peut pas être utilisé avec `--yes`
- `--ui` ne peut pas non plus être utilisé avec `--resume`
- `--ui-host` et `--ui-port` ne peuvent être utilisés qu’avec `--ui`
- `--skip-auth` ne peut pas être utilisé avec `--access-token` ou `--token`

:::

## Repérage rapide par Steps

Les Steps affichés diffèrent légèrement selon le chemin de setup. Par exemple, lorsque vous connectez une application existante, vous n’utilisez généralement que `Getting started` et `Remote connection`.

Si vous suivez l’assistant UI local étape par étape, vous pouvez d’abord utiliser le tableau ci-dessous pour vous repérer rapidement :

| Step                      | Paramètres principaux                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Paramètres

Il y a beaucoup de paramètres ; les séparer par scénario d’utilisation les rend plus clairs.

La « valeur par défaut » ci-dessous représente la valeur ou le comportement que `nb init` adopte généralement lorsque vous omettez ce paramètre.

### Bases et interaction

| Paramètre       | Type    | Valeur par défaut                                                                      | Description                                                                                           |
| --------------- | ------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                                | Ignore les invites et utilise les flags et les valeurs par défaut                                     |
| `--env`, `-e`   | string  | Aucune                                                                                 | Nom de l’env enregistré par cette initialisation ; obligatoire dans les modes `--yes` et `--resume`   |
| `--ui`          | boolean | `false`                                                                                | Ouvre l’assistant dans le navigateur local ; ne peut pas être utilisé avec `--yes` ou `--resume`      |
| `--verbose`     | boolean | `false`                                                                                | Affiche une sortie de commande détaillée                                                              |
| `--skip-skills` | boolean | `false`                                                                                | Ignore la synchronisation des NocoBase AI coding skills                                               |
| `--ui-host`     | string  | `127.0.0.1`                                                                            | Hôte accessible depuis le navigateur affiché dans l'URL de l'assistant `--ui`; le service local écoute toujours sur `0.0.0.0` |
| `--ui-port`     | integer | `0`                                                                                    | Port du service local `--ui` ; `0` signifie attribution automatique                                   |
| `--locale`      | string  | Suit `NB_LOCALE`, la configuration CLI ou la locale système ; repli final vers `en-US` | Langue des invites CLI et de l’UI locale de setup : `en-US` ou `zh-CN`                                |
| `--resume`      | boolean | `false`                                                                                | Reprend l’initialisation inachevée précédente en réutilisant la workspace env config déjà enregistrée |
| `--prepare-only` | boolean | `false`                                                                               | Enregistre et prépare un env d’installation locale, y compris les flux `--ui`, sans encore installer ni démarrer l’app |

### Connexion à une application existante

| Paramètre              | Type    | Valeur par défaut | Description                                                                                                                                                                     |
| ---------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Aucune            | Adresse racine de l’API ; doit inclure le préfixe `/api`                                                                                                                        |
| `--auth-type`, `-a`    | string  | `oauth`           | Méthode d’authentification : `basic`, `token` ou `oauth`. En général, la valeur par défaut `oauth` convient ; dans certains scénarios CI/CD, vous pouvez aussi utiliser `basic` |
| `--access-token`, `-t` | string  | Aucune            | API key ou access token utilisé pour l’authentification `token`                                                                                                                 |
| `--username`           | string  | Aucune            | Nom d’utilisateur utilisé pour l’authentification `basic`                                                                                                                       |
| `--password`           | string  | Aucune            | Mot de passe utilisé pour l’authentification `basic`                                                                                                                            |
| `--skip-auth`          | boolean | `false`           | Enregistre d’abord l’env et la méthode d’authentification, puis effectue la connexion plus tard via `nb env auth`                                                               |

### Paramètres de base pour l’installation locale

| Paramètre         | Type    | Valeur par défaut                   | Description                                                                                         |
| ----------------- | ------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                             | Langue de l’interface de l’application nouvellement installée                                       |
| `--force`, `-f`   | boolean | `false`                             | Reconfigure un env existant et remplace les ressources d’exécution en conflit si nécessaire         |
| `--app-path`      | string  | `./<envName>/`                      | Répertoire local de l’application npm/Git                                                           |
| `--app-port`      | string  | `13000`                             | Port HTTP de l’application locale ; en mode `--yes`, un port disponible sera choisi automatiquement |
| `--root-username` | string  | `nocobase` (mode `--yes`)           | Nom d’utilisateur de l’administrateur initial                                                       |
| `--root-email`    | string  | `admin@nocobase.com` (mode `--yes`) | E-mail de l’administrateur initial                                                                  |
| `--root-password` | string  | `admin123` (mode `--yes`)           | Mot de passe de l’administrateur initial                                                            |
| `--root-nickname` | string  | `Super Admin` (mode `--yes`)        | Nom d’affichage de l’administrateur initial                                                         |

### Paramètres de base de données

| Paramètre                                  | Type    | Valeur par défaut                                                      | Description                                                                         |
| ------------------------------------------ | ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                 | Indique s’il faut créer et connecter une base de données embarquée gérée par la CLI |
| `--db-dialect`                             | string  | `postgres`                                                             | Type de base de données : `postgres`, `mysql`, `mariadb`, `kingbase`                |
| `--builtin-db-image`                       | string  | Suit `--db-dialect` et la locale                                       | Image du conteneur de la base de données embarquée                                  |
| `--db-host`                                | string  | `postgres` pour une base embarquée ; `127.0.0.1` pour une base externe | Adresse hôte de la base de données                                                  |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`        | Port de la base de données                                                          |
| `--db-database`                            | string  | `nocobase` ; `kingbase` pour KingbaseES                                | Nom de la base de données                                                           |
| `--db-user`                                | string  | `nocobase`                                                             | Nom d’utilisateur de la base de données                                             |
| `--db-password`                            | string  | `nocobase`                                                             | Mot de passe de la base de données                                                  |
| `--db-schema`                              | string  | Aucune                                                                 | Schéma de base de données ; utilisé uniquement avec PostgreSQL                      |
| `--db-table-prefix`                        | string  | Aucune                                                                 | Préfixe des tables de la base de données                                            |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                                | Indique si les noms de tables et de champs utilisent le style avec soulignement     |

### Paramètres de téléchargement et de code source

| Paramètre                                            | Type    | Valeur par défaut                                                                                   | Description                                                                                                      |
| ---------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                             | Ignore le téléchargement et réutilise le répertoire local de l’application ou l’image Docker existante           |
| `--source`, `-s`                                     | string  | `docker`                                                                                            | Façon d’obtenir NocoBase : `docker`, `npm` ou `git`                                                              |
| `--version`, `-v`                                    | string  | `beta`                                                                                              | Paramètre de version : version du package npm, tag de l’image Docker ou Git ref                                  |
| `--replace`, `-r`                                    | boolean | `false`                                                                                             | Remplace le répertoire cible s’il existe déjà                                                                    |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                             | Indique s’il faut installer les devDependencies lors d’une installation npm/Git                                  |
| `--output-dir`, `-o`                                 | string  | Pour npm/Git, dérivé de `--app-path` ; pour Docker + `--docker-save`, `./nocobase-<version>`        | Répertoire cible du téléchargement, ou répertoire d’enregistrement du tarball lorsque `--docker-save` est activé |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                          | Adresse du dépôt Git                                                                                             |
| `--docker-registry`                                  | string  | `nocobase/nocobase` ; pour la locale `zh-CN`, `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Nom du dépôt d’image Docker, sans tag                                                                            |
| `--docker-platform`                                  | string  | `auto`                                                                                              | Plateforme de l’image Docker : `auto`, `linux/amd64`, `linux/arm64`                                              |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                             | Indique s’il faut aussi enregistrer l’image Docker en tarball après le pull                                      |
| `--npm-registry`                                     | string  | vide                                                                                                | Registry utilisé pour les téléchargements npm/Git et l’installation des dépendances                              |
| `--build` / `--no-build`                             | boolean | `true`                                                                                              | Indique s’il faut lancer la build après l’installation des dépendances npm/Git                                   |
| `--build-dts`                                        | boolean | `false`                                                                                             | Indique s’il faut générer les fichiers de déclaration TypeScript lors de la build npm/Git                        |

## Exemples

Voici les usages les plus courants.

### Terminer l’assistant pas à pas dans le terminal

```bash
nb init
```

### Ouvrir l’assistant dans le navigateur local

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Préparer d’abord, puis activer la licence et démarrer plus tard

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Installer une nouvelle application locale en mode non interactif

Si vous ne spécifiez pas `--source`, Docker sera généralement utilisé comme source d’installation.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Installer rapidement et utiliser l’authentification basic

Si vous souhaitez installer rapidement une application locale en mode non interactif, puis enregistrer directement l’authentification `basic` une fois l’installation terminée, vous pouvez aussi l’écrire ainsi. De cette façon, vous n’avez plus besoin d’ouvrir le navigateur pour terminer OAuth.

Si vous conservez le compte administrateur par défaut du mode `--yes`, la forme la plus courte est la suivante.

S’ils sont absents, le compte administrateur par défaut est `nocobase` et le mot de passe par défaut est `admin123` :

```bash
nb init --env app1 --yes --auth-type basic
```

Si vous souhaitez aussi personnaliser le compte administrateur, vous pouvez l’écrire ainsi :

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Se connecter à une application existante

OAuth par défaut suffit généralement. Si, dans certains scénarios CI/CD, il n’est pas pratique d’ouvrir un navigateur, vous pouvez aussi enregistrer directement l’authentification `basic` ; si vous avez déjà un API token, vous pouvez aussi enregistrer directement l’authentification `token`.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Personnaliser le nommage de la base de données

Si vous devez spécifier un schéma PostgreSQL, un préfixe de table ou un nommage avec soulignement, vous pouvez passer les paramètres ainsi :

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Reprendre l’initialisation interrompue précédente

```bash
nb init --env app1 --resume
```

### Afficher des journaux détaillés pour le dépannage

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Commandes associées

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
