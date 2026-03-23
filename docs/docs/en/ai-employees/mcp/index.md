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
