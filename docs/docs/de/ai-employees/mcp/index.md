---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

Nach dem Aktivieren des NocoBase MCP-Server-Plugins stellt deine NocoBase-Anwendung einen MCP-Endpunkt bereit, über den MCP-Clients auf NocoBase-APIs zugreifen und sie aufrufen können.

## Server-Adresse

- Hauptanwendung:

  `http(s)://<host>:<port>/api/mcp`

- Nicht-Hauptanwendung:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Dieser Endpunkt verwendet das Transportprotokoll `streamable HTTP`.

Über den Request-Header `x-mcp-packages` kannst du steuern, welche Paket-APIs MCP bereitstellt, zum Beispiel:

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

Der Header akzeptiert vollständige Paketnamen. Wenn kein Scope angegeben ist, wird automatisch `@nocobase/` ergänzt. Standardmäßig lädt MCP die APIs dieser Pakete:

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## Funktionen

- NocoBase-Kern- und Plugin-APIs
- Ein allgemeines CRUD-Tool zur Arbeit mit Datentabellen

## Schnellstart

### Codex

#### Authentifizierung mit API Key

Aktiviere zuerst das Plugin API Keys und erstelle einen API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Authentifizierung mit OAuth

Aktiviere zuerst das Plugin IdP: OAuth.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Authentifizierung mit API Key

Aktiviere zuerst das Plugin API Keys und erstelle einen API Key.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Authentifizierung mit OAuth

Aktiviere zuerst das Plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

Öffne danach Claude und melde dich beim entsprechenden MCP-Dienst an:

```bash
claude
/mcp
```

## Zusammen mit Skills verwenden

Es wird empfohlen, NocoBase MCP zusammen mit NocoBase Skills zu verwenden. Siehe [NocoBase Skills](../skills/index.md).
