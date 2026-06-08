---
title: 'nb env update'
description: 'Référence de la commande nb env update : met à jour les configurations enregistrées d’API, d’authentification, de code source, d’application et de base de données.'
keywords: 'nb env update,NocoBase CLI,configuration env,authentification,base de données,code source'
---

# nb env update

`nb env update` sert à mettre à jour la configuration d’un env déjà enregistré. Vous pouvez l’utiliser pour ajuster l’adresse API, la méthode d’authentification, la source du code, le chemin de l’application locale, le port, les paramètres de base de données, etc. Une fois la mise à jour terminée, le CLI traitera automatiquement les étapes suivantes en fonction des modifications.

Si vous n’ajoutez aucun paramètre de configuration, le CLI effectuera également une resynchronisation selon l’état actuel de l’env.

## Utilisation

```bash
nb env update [name] [flags]
```

## Paramètres généraux

| Paramètre   | Type    | Description                                                                           |
| ----------- | ------- | ------------------------------------------------------------------------------------- |
| `[name]`    | string  | Nom de l’environnement configuré à mettre à jour ; si omis, l’env actuel est utilisé. |
| `--verbose` | boolean | Affiche la progression détaillée.                                                     |

## Paramètres d’API et d’authentification

| Paramètre                         | Type   | Description                                                                                                                                                                               |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | Adresse de l’API NocoBase, incluant le préfixe `/api`.                                                                                                                                    |
| `--auth-type`                     | string | Méthode d’authentification : `basic`, `token`, `oauth`.                                                                                                                                   |
| `--access-token`, `--token`, `-t` | string | Clé API ou access token utilisé pour l’authentification `token`. Après l’enregistrement, la méthode d’authentification sera basculée vers `token`.                                        |
| `--username`                      | string | Nom d’utilisateur enregistré pour l’authentification `basic`. Peut être utilisé uniquement lorsque l’env actuel utilise `basic`, ou lorsque `--auth-type basic` est fourni en même temps. |

## Paramètres de code source et de téléchargement

| Paramètre                                      | Type    | Description                                                                               |
| ---------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `--source`                                     | string  | Source d’application enregistrée : `docker`, `git`, `local`, `npm`.                       |
| `--download-version`, `--version`              | string  | Paramètre de version enregistré : tag Docker, version de paquet npm ou ref Git.           |
| `--docker-registry`                            | string  | Nom du registre d’images Docker, sans le tag.                                             |
| `--docker-platform`                            | string  | Plateforme de l’image Docker : `auto`, `linux/amd64`, `linux/arm64`.                      |
| `--git-url`                                    | string  | Adresse du dépôt Git.                                                                     |
| `--npm-registry`                               | string  | Registry utilisé pour les téléchargements npm/Git et l’installation des dépendances.      |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Indique s’il faut installer les devDependencies lors d’une installation npm/Git.          |
| `--build` / `--no-build`                       | boolean | Indique s’il faut construire automatiquement après un téléchargement npm/Git.             |
| `--build-dts` / `--no-build-dts`               | boolean | Indique s’il faut générer les fichiers de déclaration TypeScript lors de la construction. |

## Paramètres de l’application

| Paramètre    | Type   | Description                                                                                                                     |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Répertoire de l’application. Il est désormais recommandé d’utiliser en priorité ce paramètre pour gérer les répertoires locaux. |
| `--app-port` | string | Port HTTP de l’application.                                                                                                     |
| `--app-key`  | string | Clé de l’application (`APP_KEY`).                                                                                               |
| `--timezone` | string | Fuseau horaire de l’application (`TZ`).                                                                                         |

## Paramètres de base de données

| Paramètre                                  | Type    | Description                                                                    |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------------ |
| `--builtin-db` / `--no-builtin-db`         | boolean | Indique s’il faut utiliser la base de données intégrée gérée par le CLI.       |
| `--db-dialect`                             | string  | Type de base de données : `postgres`, `mysql`, `mariadb`, `kingbase`.          |
| `--builtin-db-image`                       | string  | Image de conteneur de la base de données intégrée.                             |
| `--db-host`                                | string  | Adresse de l’hôte de la base de données.                                       |
| `--db-port`                                | string  | Port de la base de données.                                                    |
| `--db-database`                            | string  | Nom de la base de données.                                                     |
| `--db-user`                                | string  | Nom d’utilisateur de la base de données.                                       |
| `--db-password`                            | string  | Mot de passe de la base de données.                                            |
| `--db-schema`                              | string  | Schéma de la base de données. Généralement utilisé uniquement avec PostgreSQL. |
| `--db-table-prefix`                        | string  | Préfixe des tables de base de données.                                         |
| `--db-underscored` / `--no-db-underscored` | boolean | Indique si les noms de tables et de champs utilisent le style avec tirets bas. |

## Paramètres de nettoyage de configuration

| Paramètre | Type     | Description                                                                                                                                                                                |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--unset` | string[] | Efface un ou plusieurs champs enregistrés selon le nom canonique du flag. Peut être répété ou fourni sous forme de liste séparée par des virgules, par exemple `--unset git-url,username`. |

## Remarques

:::tip

Si vous voulez simplement que le CLI resynchronise selon le dernier état actuel de l’env, il suffit d’exécuter `nb env update` ou `nb env update <name>`, sans paramètre supplémentaire.

:::

- Une fois la mise à jour terminée, le CLI traitera automatiquement les synchronisations de suivi nécessaires en fonction de cette modification.
- Les autres paramètres ne mettront à jour que la configuration enregistrée de l’env ; ils ne redémarreront pas automatiquement l’application et ne remplaceront pas automatiquement le code source local ni les images Docker.
- Après avoir modifié des configurations comme `app-path`, `app-port`, `timezone`, `db-*`, le CLI vous invitera généralement à exécuter ensuite `nb app restart --env <name>` ; si la modification implique la base de données intégrée gérée par le CLI, il vous invitera à utiliser `nb app restart --env <name> --with-db`.
- Lors de la mise à jour de paramètres de code source comme `source`, `download-version`, `docker-registry`, `git-url`, `npm-registry`, seules les valeurs enregistrées seront modifiées. Le code source local existant, les dépendances et les images ne seront pas remplacés automatiquement.
- `--access-token` ne peut pas être utilisé avec `--auth-type basic` ou `--auth-type oauth`.
- Un même champ ne peut pas être utilisé à la fois avec `--unset` et une valeur explicite. Par exemple, vous ne pouvez pas écrire en même temps `--unset git-url` et `--git-url ...`.
- Si vous basculez la méthode d’authentification vers `basic` ou `oauth`, ou si vous effacez le token, vous devrez généralement ensuite exécuter `nb env auth <name>`.

## Exemples

```bash
# Resynchroniser l’env actuel selon le dernier état
nb env update

# Resynchroniser l’env spécifié selon le dernier état
nb env update prod

# Mettre à jour l’adresse API
nb env update prod --api-base-url http://localhost:13000/api

# Mettre à jour le token et basculer la méthode d’authentification vers token
nb env update prod --access-token <token>

# Basculer vers l’authentification basic, enregistrer seulement le nom d’utilisateur, puis exécuter nb env auth plus tard
nb env update prod --auth-type basic --username admin

# Ajuster la source du code et la version, mettre à jour uniquement la configuration enregistrée
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajuster le port de l’application et le fuseau horaire, puis redémarrer l’application plus tard
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Effacer les champs enregistrés
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Commandes associées

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
