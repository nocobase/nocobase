---
pkg: "@nocobase/plugin-logger"
---


pkg: '@nocobase/plugin-logger'
---

# Logs

## Introduction

Les logs sont un moyen essentiel pour nous aider à identifier les problèmes système. Les logs serveur de NocoBase comprennent principalement les logs de requêtes d'API et les logs de fonctionnement du système. Ils prennent en charge la configuration du niveau de log, de la stratégie de rotation, de la taille, du format d'affichage, et bien plus encore. Ce document présente principalement le contenu relatif aux logs serveur de NocoBase, ainsi que la manière d'utiliser les fonctionnalités d'archivage et de téléchargement des logs serveur offertes par le plugin de journalisation.

## Configuration des logs

Vous pouvez configurer les paramètres liés aux logs, tels que le niveau de log, la méthode de sortie et le format d'affichage, via les [variables d'environnement](/get-started/installation/env.md#logger_transport).

## Formats de logs

NocoBase prend en charge la configuration de quatre formats de logs différents.

### `console`

C'est le format par défaut en environnement de développement, où les messages sont affichés avec des couleurs de surbrillance.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f77-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f77-456b-a295-0c8a28938228
```

### `json`

C'est le format par défaut en environnement de production.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Les champs sont séparés par le délimiteur `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Répertoire des logs

La structure principale des répertoires des fichiers de logs NocoBase est la suivante :

- `storage/logs` - Répertoire de sortie des logs
  - `main` - Nom de l'application principale
    - `request_YYYY-MM-DD.log` - Log des requêtes
    - `system_YYYY-MM-DD.log` - Log système
    - `system_error_YYYY-MM-DD.log` - Log des erreurs système
    - `sql_YYYY-MM-DD.log` - Log d'exécution SQL
    - ...
  - `sub-app` - Nom de la sous-application
    - `request_YYYY-MM-DD.log`
    - ...

## Fichiers de logs

### Log des requêtes

`request_YYYY-MM-DD.log`, logs des requêtes et réponses d'API.

| Champ         | Description                               |
| ------------- | ----------------------------------------- |
| `level`       | Niveau de log                             |
| `timestamp`   | Heure d'enregistrement du log `AAAA-MM-JJ hh:mm:ss` |
| `message`     | `request` ou `response`                   |
| `userId`      | Présent uniquement dans `response`        |
| `method`      | Méthode de la requête                     |
| `path`        | Chemin de la requête                      |
| `req` / `res` | Contenu de la requête/réponse             |
| `action`      | Ressources et paramètres de la requête    |
| `status`      | Code de statut de la réponse              |
| `cost`        | Durée de la requête                       |
| `app`         | Nom de l'application actuelle             |
| `reqId`       | ID de la requête                          |

:::info{title=Note}
L'`reqId` est transmis au frontend via l'en-tête de réponse `X-Request-Id`.
:::

### Log système

`system_YYYY-MM-DD.log`, logs de fonctionnement du système (application, middleware, plugins, etc.). Les logs de niveau `error` sont imprimés séparément dans `system_error_YYYY-MM-DD.log`.

| Champ       | Description                               |
| ----------- | ----------------------------------------- |
| `level`     | Niveau de log                             |
| `timestamp` | Heure d'enregistrement du log `AAAA-MM-JJ hh:mm:ss` |
| `message`   | Message du log                            |
| `module`    | Module                                    |
| `submodule` | Sous-module                               |
| `method`    | Méthode appelée                           |
| `meta`      | Autres informations pertinentes, format JSON |
| `app`       | Nom de l'application actuelle             |
| `reqId`     | ID de la requête                          |

### Log d'exécution SQL

`sql_YYYY-MM-DD.log`, logs d'exécution SQL de la base de données. Les instructions `INSERT INTO` sont limitées aux 2000 premiers caractères.

| Champ       | Description                               |
| ----------- | ----------------------------------------- |
| `level`     | Niveau de log                             |
| `timestamp` | Heure d'enregistrement du log `AAAA-MM-JJ hh:mm:ss` |
| `sql`       | Instruction SQL                           |
| `app`       | Nom de l'application actuelle             |
| `reqId`     | ID de la requête                          |

## Archivage et téléchargement des logs

1. Accédez à la page de gestion des logs.
2. Sélectionnez les fichiers de logs que vous souhaitez télécharger.
3. Cliquez sur le bouton Télécharger (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Documentation connexe

- [Développement de plugin - Serveur - Logs](/plugin-development/server/logger)
- [Référence API - @nocobase/logger](/api/logger/logger)