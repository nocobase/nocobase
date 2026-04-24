---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

After enabling the NocoBase MCP service plugin, the NocoBase application exposes an MCP service endpoint for MCP clients to access and call NocoBase APIs.

## Service URL

- Main application:

  `http(s)://<host>:<port>/api/mcp`

- Sub-application:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

This endpoint uses the `streamable HTTP` transport protocol.

## Capabilities

### General Tools

Can be used to operate data tables.

| Tool Name          | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `resource_list`    | Get a list of records                                              |
| `resource_get`     | Get record details                                                 |
| `resource_create`  | Create a record                                                    |
| `resource_update`  | Update a record                                                    |
| `resource_destroy` | Delete a record                                                    |
| `resource_query`   | Query data with complex conditions such as aggregation and joins   |

### NocoBase Core and Plugin APIs

You can control which package APIs are exposed by MCP using the `x-mcp-packages` request header, for example:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

This header supports full package names. Names without a scope will be automatically prefixed with `@nocobase/`.

By default, no package APIs other than general tools are loaded. It is recommended to use [NocoBase CLI](../quick-start.md) for operating other system features.

Common packages:

| Package Name                           | Description                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Manage the main data source, including creating data tables and adding fields |
| `@nocobase/plugin-data-source-manager` | Manage data sources and get available data source information |
| `@nocobase/plugin-workflow`            | Manage workflows                                     |
| `@nocobase/plugin-acl`                 | Manage roles and permissions                         |
| `@nocobase/plugin-users`               | Manage users                                         |

For more packages and related API documentation, refer to the [API Documentation](/integration/api-doc) plugin.

## Authentication

### API Key Authentication

Call the MCP service endpoint using an API key created through the [API keys](/auth-verification/api-keys/) plugin. Permissions are determined by the role bound to the API key.

### OAuth Authentication

Call the MCP service endpoint using an access token obtained through OAuth authentication. Permissions are determined by the authorized user. If the user has multiple roles, you can set the calling role via the `x-role` request header.

## Quick Start

### Codex

#### Using API Key Authentication

First enable the API Keys plugin and create an API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Using OAuth Authentication

First enable the IdP: OAuth plugin.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Using API Key Authentication

First enable the API Keys plugin and create an API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Using OAuth Authentication

First enable the IdP: OAuth plugin.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

After execution, open Claude and select the corresponding MCP service to log in:

```bash
claude
/mcp
```

### OpenCode

#### Using API Key Authentication

First enable the API Keys plugin and create an API Key. Configure `opencode.json`:

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

#### Using OAuth Authentication

First enable the IdP: OAuth plugin. Configure `opencode.json`:

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

Login authentication

```bash
opencode mcp auth nocobase
```

Debug

```bash
opencode mcp debug nocobase
```
