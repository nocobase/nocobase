---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

Después de habilitar el plugin NocoBase MCP Server, tu aplicación NocoBase expondrá un endpoint MCP para que los clientes MCP puedan acceder y llamar a las APIs de NocoBase.

## Dirección del servidor

- Aplicación principal:

  `http(s)://<host>:<port>/api/mcp`

- Aplicación no principal:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Este endpoint utiliza el transporte `streamable HTTP`.

Puedes usar la cabecera de solicitud `x-mcp-packages` para controlar qué APIs de paquetes expone MCP, por ejemplo:

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

Esta cabecera acepta nombres completos de paquetes. Si no se incluye el scope, se añadirá automáticamente `@nocobase/`. De forma predeterminada, MCP carga las APIs de estos paquetes:

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## Capacidades

- APIs del núcleo de NocoBase y de sus plugins
- Una herramienta CRUD genérica para trabajar con tablas de datos

## Inicio rápido

### Codex

#### Autenticación con API Key

Primero, habilita el plugin API Keys y crea una API key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Autenticación con OAuth

Primero, habilita el plugin IdP: OAuth.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Autenticación con API Key

Primero, habilita el plugin API Keys y crea una API key.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Autenticación con OAuth

Primero, habilita el plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

Después, abre Claude e inicia sesión en el servicio MCP correspondiente:

```bash
claude
/mcp
```

### OpenCode

#### Autenticación con API Key

Primero, habilita el plugin API Keys y crea una API key. Configura `opencode.json`:

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

#### Autenticación con OAuth

Primero, habilita el plugin IdP: OAuth. Configura `opencode.json`:

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

Inicio de sesión

```bash
opencode mcp auth nocobase
```

Depuración

```bash
opencode mcp debug nocobase
```

## Uso junto con Skills

Se recomienda usar NocoBase MCP junto con NocoBase Skills. Consulta [NocoBase Skills](../skills/index.md).
