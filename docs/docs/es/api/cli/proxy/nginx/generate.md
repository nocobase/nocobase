---
title: "nb proxy nginx generate"
description: "Generar o actualizar la configuración de Nginx para un env gestionado por la CLI."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

Genera o actualiza la configuración de entrada de Nginx para un env gestionado por la CLI.

## Uso

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env gestionado por la CLI para el que se generará la configuración |
| `--host` | string | Host escrito en la configuración de entrada, como `app1.example.com` |
| `--port` | string | Puerto de escucha escrito en la configuración de entrada, como `8080` |

## Archivos generados

Usando el env `test2` como ejemplo, el comando suele mantener estos archivos y directorios:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

La entrada generada cubre estas áreas principales:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Ejemplos

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Notas

- `generate` solo escribe o actualiza la configuración y no inicia Nginx automáticamente
- `app.conf` es el archivo de entrada editable, pero su bloque gestionado debe mantenerse intacto
- Si cambias ajustes como `app-port` o `app-public-path` con `nb env update`, normalmente tendrás que volver a ejecutar este comando
- Solo los env gestionados por la CLI de tipo `local` o `docker` pueden usar este comando

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
