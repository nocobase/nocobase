---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

After enabling the NocoBase MCP Server plugin, your NocoBase app exposes an MCP endpoint that MCP clients can use to access and call NocoBase APIs.

## Server URL

- Main app:

  `http(s)://<host>:<port>/api/mcp`

- Non-main app:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

This endpoint uses the `streamable HTTP` transport.

You can use the `x-mcp-packages` request header to control which package APIs are exposed by MCP, for example:

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

This header accepts full package names. If a scope is omitted, `@nocobase/` is added automatically. By default, MCP loads these package APIs:

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## What It Provides

- NocoBase core and plugin APIs
- A generic CRUD tool for working with data tables

## Quick Start

### Codex

#### Authenticate with API Key

First, enable the API Keys plugin and create an API key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Authenticate with OAuth

First, enable the IdP: OAuth plugin.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Authenticate with API Key

First, enable the API Keys plugin and create an API key.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Authenticate with OAuth

First, enable the IdP: OAuth plugin.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

Then open Claude and sign in to the corresponding MCP service:

```bash
claude
/mcp
```

## Use with Skills

It is recommended to use NocoBase MCP together with NocoBase Skills. See [NocoBase Skills](../skills/index.md).
