---
title: 'nb config'
description: 'Referencia del comando nb config: gestiona los elementos de configuración predeterminados de NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,configuración,configuración predeterminada'
---

# nb config

Gestiona la configuración predeterminada de la CLI. Los elementos de configuración compatibles actualmente incluyen:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Elementos de configuración comunes

| Elemento de configuración | Valor predeterminado | Descripción |
| --- | --- | --- |
| `locale` | Se resuelve según las reglas actuales de la CLI | Sobrescribe el idioma usado por la CLI |
| `update.policy` | `prompt` | Política de actualización al iniciar: `prompt`, `auto` u `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Sobrescribe la URL de descarga de los paquetes de extensiones comerciales |
| `docker.network` | `nocobase` | Red predeterminada para aplicaciones Docker gestionadas por la CLI |
| `docker.container-prefix` | `nb` | Prefijo predeterminado para contenedores Docker gestionados por la CLI |
| `bin.docker` | `docker` | Sobrescribe la ruta del ejecutable de Docker |
| `bin.caddy` | `caddy` | Sobrescribe la ruta del ejecutable de Caddy |
| `bin.git` | `git` | Sobrescribe la ruta del ejecutable de Git |
| `bin.nginx` | `nginx` | Sobrescribe la ruta del ejecutable de Nginx |
| `bin.yarn` | `yarn` | Sobrescribe la ruta del ejecutable de Yarn |
| `proxy.provider` | `nginx` | Proveedor de proxy predeterminado usado por `nb env proxy` |
| `proxy.nb-cli-root` | Raíz de la CLI, normalmente el directorio home del usuario actual | Mapea la ruta `.nocobase` a la ruta raíz visible para el proceso del proxy |
| `proxy.upstream-host` | `127.0.0.1` | Host que usa el proxy para reenviar el tráfico de vuelta a la aplicación NocoBase |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb config get`](./get.md)       | Lee el valor efectivo de un elemento de configuración             |
| [`nb config set`](./set.md)       | Establece un elemento de configuración                            |
| [`nb config delete`](./delete.md) | Elimina un elemento configurado explícitamente                    |
| [`nb config list`](./list.md)     | Lista los elementos de configuración establecidos explícitamente  |

## Ejemplos

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
