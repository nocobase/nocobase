---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

Une fois le plugin de service MCP de NocoBase activé, l'application NocoBase expose une interface de service MCP, permettant à un client MCP d'accéder aux interfaces de NocoBase et de les appeler.

## Adresse du service

- Application principale :

  `http(s)://<host>:<port>/api/mcp`

- Sous-application :

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Cette adresse utilise le protocole de transport `streamable HTTP`.

## Capacités fournies

### Outils génériques

Utilisables pour manipuler les tables de données.

| Nom de l'outil     | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `resource_list`    | Récupérer la liste des données                                       |
| `resource_get`     | Récupérer les détails d'une donnée                                   |
| `resource_create`  | Créer des données                                                    |
| `resource_update`  | Mettre à jour des données                                            |
| `resource_destroy` | Supprimer des données                                                |
| `resource_query`   | Interroger les données, prend en charge les requêtes complexes (agrégation, requêtes liées, etc.) |

### Interfaces du noyau NocoBase et des plugins

Vous pouvez contrôler quels packages exposent leurs interfaces via MCP grâce à l'en-tête de requête `x-mcp-packages`, par exemple :

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Cet en-tête accepte les noms de packages complets ; en l'absence de scope, `@nocobase/` est ajouté automatiquement.

Par défaut, seuls les outils génériques sont chargés ; pour les autres fonctionnalités du système, il est recommandé d'utiliser plutôt la [NocoBase CLI](../quick-start.md).

Description des packages courants :

| Nom du package                          | Description                                          |
| --------------------------------------- | ---------------------------------------------------- |
| `@nocobase/plugin-data-source-main`     | Gérer la source de données principale (créer des tables, ajouter des champs, etc.) |
| `@nocobase/plugin-data-source-manager`  | Gérer les sources de données, obtenir les sources disponibles |
| `@nocobase/plugin-workflow`             | Gérer les workflows                                  |
| `@nocobase/plugin-acl`                  | Gérer les rôles et permissions                       |
| `@nocobase/plugin-users`                | Gérer les utilisateurs                               |

Pour plus de packages et la description de leurs interfaces, vous pouvez consulter le plugin [Documentation API](/integration/api-doc).

## Méthodes d'authentification

### Authentification par API Key

Utilisez une API key créée via le plugin [API keys](/auth-verification/api-keys/index.md) pour appeler les interfaces du service MCP ; les permissions sont déterminées par le rôle associé à la clé.

### Authentification OAuth

Utilisez l'access token obtenu après autorisation OAuth pour appeler les interfaces du service MCP ; les permissions sont déterminées par l'utilisateur autorisé. Si l'utilisateur a plusieurs rôles, vous pouvez définir le rôle d'appel via l'en-tête de requête `x-role`.

## Démarrage rapide

### Codex

#### Authentification par API Key

Activez d'abord le plugin API Keys et créez une API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Authentification OAuth

Activez d'abord le plugin IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Authentification par API Key

Activez d'abord le plugin API Keys et créez une API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Authentification OAuth

Activez d'abord le plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

Une fois exécuté, ouvrez Claude et connectez-vous au service MCP correspondant :

```bash
claude
/mcp
```

### OpenCode

#### Authentification par API Key

Activez d'abord le plugin API Keys et créez une API Key. Configurez `opencode.json` :

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### Authentification OAuth

Activez d'abord le plugin IdP: OAuth. Configurez `opencode.json` :

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

Authentification :

```bash
opencode mcp auth nocobase
```

Debug :

```bash
opencode mcp debug nocobase
```
