---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

Après avoir activé le plugin NocoBase MCP Server, votre application NocoBase expose un endpoint MCP que les clients MCP peuvent utiliser pour accéder aux API NocoBase et les appeler.

## Adresse du serveur

- Application principale :

  `http(s)://<host>:<port>/api/mcp`

- Application non principale :

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Cet endpoint utilise le transport `streamable HTTP`.

Vous pouvez utiliser l'en-tête de requête `x-mcp-packages` pour contrôler quelles API de paquets sont exposées par MCP, par exemple :

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

Cet en-tête accepte les noms de paquets complets. Si le scope est omis, `@nocobase/` est ajouté automatiquement. Par défaut, MCP charge les API de ces paquets :

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## Capacités

- API du noyau NocoBase et de ses plugins
- Un outil CRUD générique pour manipuler les tables de données

## Démarrage rapide

### Codex

#### Authentification avec API Key

Activez d'abord le plugin API Keys et créez une API key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Authentification avec OAuth

Activez d'abord le plugin IdP: OAuth.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Authentification avec API Key

Activez d'abord le plugin API Keys et créez une API key.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Authentification avec OAuth

Activez d'abord le plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

Ensuite, ouvrez Claude et connectez-vous au service MCP correspondant :

```bash
claude
/mcp
```

### OpenCode

#### Authentification avec API Key

Activez d'abord le plugin API Keys et créez une API key. Configurez `opencode.json` :

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

#### Authentification avec OAuth

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

Connexion

```bash
opencode mcp auth nocobase
```

Débogage

```bash
opencode mcp debug nocobase
```

## Utilisation avec Skills

Il est recommandé d'utiliser NocoBase MCP avec NocoBase Skills. Voir [NocoBase Skills](../skills/index.md).
