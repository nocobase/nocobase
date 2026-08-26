---
title: "nb env update"
description: "Référence de la commande nb env update : mettre à jour la configuration enregistrée de l'API, de l'authentification, du code source, de l'application et de la base de données."
keywords: "nb env update,NocoBase CLI,configuration d'env,authentification,base de données,code source"
---

# nb env update

`nb env update` met à jour la configuration d'un env enregistré. Tu peux l'utiliser pour ajuster l'adresse de l'API, la méthode d'authentification, l'origine du code source, le chemin local de l'application, le chemin public, le port, les paramètres de base de données, et plus encore. Une fois la mise à jour terminée, la CLI traite automatiquement les étapes de suivi nécessaires en fonction des changements.

Si tu ne fournis aucun paramètre de configuration, la CLI effectue quand même une resynchronisation basée sur l'état actuel de l'env.

## Utilisation

```bash
nb env update [name] [flags]
```

## Options courantes

| Option | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l'env configuré à mettre à jour. Si omis, l'env courant est utilisé |
| `--verbose` | boolean | Afficher une progression détaillée |

## Options d'API et d'authentification

| Option | Type | Description |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | URL de l'API NocoBase, y compris le préfixe `/api` |
| `--auth-type` | string | Méthode d'authentification : `basic`, `token` ou `oauth` |
| `--access-token`, `--token`, `-t` | string | API key ou access token utilisé avec l'authentification `token`. Son enregistrement bascule aussi le type d'authentification sur `token` |
| `--username` | string | Nom d'utilisateur enregistré pour l'authentification `basic`. À utiliser uniquement si l'env courant utilise déjà `basic`, ou avec `--auth-type basic` |

## Options de source et de téléchargement

| Option | Type | Description |
| --- | --- | --- |
| `--source` | string | Source enregistrée de l'application : `docker`, `git`, `local` ou `npm` |
| `--download-version`, `--version` | string | Sélecteur de version enregistré : tag Docker, version de paquet npm ou ref Git |
| `--docker-registry` | string | Nom du registre d'images Docker, sans le tag |
| `--docker-platform` | string | Plateforme de l'image Docker : `auto`, `linux/amd64` ou `linux/arm64` |
| `--git-url` | string | URL du dépôt Git |
| `--npm-registry` | string | Registre utilisé pour les téléchargements npm ou Git et l'installation des dépendances |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Installer ou non les `devDependencies` pour les sources npm ou Git |
| `--build` / `--no-build` | boolean | Compiler automatiquement ou non après un téléchargement npm ou Git |
| `--build-dts` / `--no-build-dts` | boolean | Générer ou non les fichiers de déclaration TypeScript pendant la compilation |

## Options d'application

| Option | Type | Description |
| --- | --- | --- |
| `--app-path` | string | Répertoire de l'application. C'est désormais la méthode recommandée pour gérer le chemin local de l'application |
| `--app-public-path` | string | Chemin public de l'application (`APP_PUBLIC_PATH`), comme `/` ou `/nocobase/` |
| `--app-port` | string | Port HTTP de l'application |
| `--cdn-base-url` | string | URL de base du CDN pour les ressources statiques du client (`CDN_BASE_URL`) |
| `--app-key` | string | Clé de l'application (`APP_KEY`) |
| `--timezone` | string | Fuseau horaire de l'application (`TZ`) |

## Options de base de données

| Option | Type | Description |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Indique s'il faut utiliser la base de données intégrée gérée par la CLI |
| `--db-dialect` | string | Type de base de données : `postgres`, `mysql`, `mariadb` ou `kingbase` |
| `--builtin-db-image` | string | Image de conteneur utilisée pour la base de données intégrée |
| `--db-host` | string | Hôte de la base de données |
| `--db-port` | string | Port de la base de données |
| `--db-database` | string | Nom de la base de données |
| `--db-user` | string | Nom d'utilisateur de la base de données |
| `--db-password` | string | Mot de passe de la base de données |
| `--db-schema` | string | Schéma de la base de données. Cela n'est généralement utilisé que pour PostgreSQL |
| `--db-table-prefix` | string | Préfixe de table |
| `--db-underscored` / `--no-db-underscored` | boolean | Indique si les noms de tables et de champs utilisent le style avec underscores |

## Nettoyage de configuration

| Option | Type | Description |
| --- | --- | --- |
| `--unset` | string[] | Effacer un ou plusieurs champs enregistrés à partir du nom de flag. Tu peux répéter l'option ou passer une liste séparée par des virgules, comme `--unset git-url,username` |

## Notes

:::tip

Si tu veux simplement que la CLI resynchronise l'env courant selon son état le plus récent, exécute simplement `nb env update` ou `nb env update <name>` sans option supplémentaire.

:::

- Une fois la mise à jour terminée, la CLI traite automatiquement les synchronisations de suivi nécessaires en fonction des changements effectués cette fois-ci
- Les autres options mettent seulement à jour la configuration enregistrée de l'env. Elles ne redémarrent pas automatiquement l'application et ne remplacent pas non plus le code source local ou les images Docker
- Après modification de paramètres comme `app-path`, `app-port`, `timezone` ou `db-*`, la CLI t'indiquera généralement d'exécuter `nb app restart --env <name>` ; si le changement concerne la base de données intégrée gérée par la CLI, elle indiquera d'utiliser `nb app restart --env <name> --with-db`
- Après modification de paramètres comme `app-port`, `app-public-path` ou `cdn-base-url` qui affectent le résultat du reverse proxy, réexécute `nb proxy nginx generate` ou `nb proxy caddy generate` si tu utilises déjà une configuration proxy générée
- Lors de la mise à jour de paramètres de source comme `source`, `download-version`, `docker-registry`, `git-url` ou `npm-registry`, seules les valeurs enregistrées changent. Le code source local, les dépendances et les images existants ne sont pas remplacés automatiquement
- `--access-token` ne peut pas être utilisé avec `--auth-type basic` ou `--auth-type oauth`
- Le même champ ne peut pas être utilisé à la fois avec `--unset` et avec une valeur explicite. Par exemple, n'utilise pas `--unset git-url` avec `--git-url ...`
- Si tu bascules la méthode d'authentification vers `basic` ou `oauth`, ou si tu effaces le token, tu devras généralement exécuter ensuite `nb env auth <name>`

## Exemples

```bash
# Resynchroniser l'env courant selon son dernier état enregistré
nb env update

# Resynchroniser un env spécifique
nb env update prod

# Mettre à jour l'URL de l'API
nb env update prod --api-base-url http://localhost:13000/api

# Mettre à jour le token et basculer le type d'authentification vers token
nb env update prod --access-token <token>

# Passer à l'authentification basic, enregistrer le nom d'utilisateur et exécuter nb env auth plus tard
nb env update prod --auth-type basic --username admin

# Mettre à jour la source et la version enregistrées sans remplacer immédiatement le code local
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajuster le port de l'application et le fuseau horaire, puis redémarrer plus tard
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Ajuster le chemin public et régénérer le proxy ensuite si nécessaire
nb env update local --app-public-path /nocobase/

# Enregistrer l'URL de base du CDN pour les ressources du client
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# Effacer des champs enregistrés
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
