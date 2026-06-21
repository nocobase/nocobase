---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

Tras habilitar el plugin de servicio NocoBase MCP, la aplicación NocoBase expone una interfaz de servicio MCP que los clientes MCP pueden utilizar para acceder e invocar las API de NocoBase.

## Dirección del servicio

- Aplicación principal:

  `http(s)://<host>:<port>/api/mcp`

- Subaplicación:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Esta dirección utiliza el protocolo de transporte `streamable HTTP`.

## Capacidades proporcionadas

### Herramientas generales

Pueden utilizarse para operar sobre tablas de datos.

| Nombre de la herramienta | Descripción de la función                                          |
| ------------------------ | ------------------------------------------------------------------ |
| `resource_list`          | Obtener lista de datos                                             |
| `resource_get`           | Obtener detalles de un dato                                        |
| `resource_create`        | Crear datos                                                        |
| `resource_update`        | Actualizar datos                                                   |
| `resource_destroy`       | Eliminar datos                                                     |
| `resource_query`         | Consultar datos, admite condiciones complejas como agregaciones, consultas relacionadas, etc. |

### Núcleo de NocoBase y APIs de los plugins

Se admite el control de qué paquetes expone MCP mediante la cabecera de petición `x-mcp-packages`, por ejemplo:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Esta cabecera admite el nombre de paquete completo. Si no se incluye el scope, se completa automáticamente con `@nocobase/`.

Por defecto no se cargan APIs de paquetes distintos a las herramientas generales. Se recomienda utilizar [NocoBase CLI](../quick-start.md) para operar otras funcionalidades del sistema.

Descripción de paquetes habituales:

| Nombre del paquete                     | Descripción de la función                              |
| -------------------------------------- | ------------------------------------------------------ |
| `@nocobase/plugin-data-source-main`    | Gestionar la fuente de datos principal, incluyendo crear tablas, añadir campos, etc. |
| `@nocobase/plugin-data-source-manager` | Gestionar fuentes de datos, obtener información sobre las disponibles |
| `@nocobase/plugin-workflow`            | Gestionar flujos de trabajo                            |
| `@nocobase/plugin-acl`                 | Gestionar roles y permisos                             |
| `@nocobase/plugin-users`               | Gestionar usuarios                                     |

Para más paquetes y la descripción de sus APIs, consulte el plugin [Documentación de la API](/integration/api-doc).

## Métodos de autenticación

### Autenticación con API Key

Utilice la API key creada con el plugin [API keys](/auth-verification/api-keys/index.md) para invocar las APIs del servicio MCP. Los permisos vienen determinados por el rol vinculado a la API key.

### Autenticación con OAuth

Utilice el access token obtenido tras la autorización OAuth para invocar las APIs del servicio MCP. Los permisos vienen determinados por el usuario autorizado. Si el usuario tiene varios roles, puede utilizar la cabecera `x-role` para indicar el rol con el que se realiza la llamada.

## Inicio rápido

### Codex

#### Con autenticación por API Key

Primero habilite el plugin API Keys y cree una API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Con autenticación OAuth

Primero habilite el plugin IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Con autenticación por API Key

Primero habilite el plugin API Keys y cree una API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Con autenticación OAuth

Primero habilite el plugin IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

Tras la ejecución, abra Claude y seleccione el servicio MCP correspondiente para iniciar sesión:

```bash
claude
/mcp
```

### OpenCode

#### Con autenticación por API Key

Primero habilite el plugin API Keys y cree una API Key. Configure `opencode.json`:

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

#### Con autenticación OAuth

Primero habilite el plugin IdP: OAuth. Configure `opencode.json`:

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

Iniciar sesión:

```bash
opencode mcp auth nocobase
```

Depurar:

```bash
opencode mcp debug nocobase
```
