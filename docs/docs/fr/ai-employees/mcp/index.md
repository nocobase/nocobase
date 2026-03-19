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

## Utilisation avec Skills

Il est recommandé d'utiliser NocoBase MCP avec NocoBase Skills. Voir [NocoBase Skills](../skills/index.md).
