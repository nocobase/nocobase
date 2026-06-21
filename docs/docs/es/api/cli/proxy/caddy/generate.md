---
title: "nb proxy caddy generate"
description: "Generar o actualizar la configuración de Caddy para un env gestionado por la CLI."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

Genera o actualiza la configuración de entrada de Caddy para un env gestionado por la CLI.

## Uso

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env gestionado por la CLI para el que se generará la configuración |
| `--host` | string | Host escrito en la dirección del sitio, como `app1.example.com` |
| `--port` | string | Puerto de escucha escrito en la dirección del sitio, como `8080` |

## Archivos generados

Usando el env `test2` como ejemplo, el comando suele mantener estos archivos y directorios:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

En el diseño actual, `app.caddy` ya es la configuración completa del sitio para un env y ya no se divide en un archivo `generated.caddy` independiente.

## Ejemplos

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Notas

- `generate` solo escribe o actualiza la configuración y no inicia Caddy automáticamente
- Regenerar la configuración sobrescribe `app.caddy` por completo
- Si cambias ajustes como `app-port` o `app-public-path` con `nb env update`, normalmente tendrás que volver a ejecutar este comando
- Solo los env gestionados por la CLI de tipo `local` o `docker` pueden usar este comando

## Comandos relacionados

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
