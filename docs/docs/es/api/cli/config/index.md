---
title: "nb config"
description: "Referencia de nb config: gestionar los valores de configuración predeterminados de NocoBase CLI."
keywords: "nb config,NocoBase CLI,configuración,configuración predeterminada"
---

# nb config

Gestiona los valores de configuración predeterminados de la CLI. Las claves compatibles actualmente se agrupan principalmente así:

- La propia CLI: `locale`, `update.policy`, `license.pkg-url`
- Runtime de Docker: `docker.network`, `docker.container-prefix`
- Ejecutables externos: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.yarn`
- Generación de proxy: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

La mayoría de los proyectos solo necesitan unas pocas de estas claves. En la práctica, las más habituales son:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` o `bin.caddy`
- `proxy.nginx-driver` o `proxy.caddy-driver`

## Claves de configuración comunes

| Clave | Valor predeterminado | Descripción |
| --- | --- | --- |
| `locale` | se resuelve según las reglas actuales de la CLI | Sobrescribe el idioma usado por la CLI |
| `update.policy` | `prompt` | Política de actualización al iniciar: `prompt`, `auto` u `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Sobrescribe la URL de descarga de paquetes de extensiones comerciales |
| `docker.network` | `nocobase` | Red predeterminada para aplicaciones Docker gestionadas por la CLI |
| `docker.container-prefix` | `nb` | Prefijo predeterminado para contenedores Docker gestionados por la CLI |
| `bin.docker` | `docker` | Sobrescribe la ruta del ejecutable de Docker |
| `bin.caddy` | `caddy` | Sobrescribe la ruta del ejecutable de Caddy |
| `bin.git` | `git` | Sobrescribe la ruta del ejecutable de Git |
| `bin.nginx` | `nginx` | Sobrescribe la ruta del ejecutable de Nginx |
| `bin.yarn` | `yarn` | Sobrescribe la ruta del ejecutable de Yarn |
| `proxy.nb-cli-root` | raíz de la CLI, normalmente el directorio home del usuario actual | Sobrescribe la ruta raíz visible para la configuración de proxy generada cuando el proceso del proxy y la CLI no ven la misma raíz del sistema de archivos |
| `proxy.upstream-host` | `127.0.0.1` | Sobrescribe el host usado por el proxy para reenviar tráfico a la aplicación NocoBase |
| `proxy.nginx-driver` | `local` | Driver de runtime predeterminado usado por `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Driver de runtime predeterminado usado por `nb proxy caddy` |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb config get`](./get.md) | Leer el valor efectivo de una clave de configuración |
| [`nb config set`](./set.md) | Establecer una clave de configuración |
| [`nb config delete`](./delete.md) | Eliminar una clave de configuración definida explícitamente |
| [`nb config list`](./list.md) | Listar las claves de configuración definidas explícitamente en este momento |

## Ejemplos

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Notas

- `bin.nginx` y `bin.caddy` solo afectan al driver `local` de `nb proxy nginx` y `nb proxy caddy`
- `proxy.nginx-driver` y `proxy.caddy-driver` almacenan el driver predeterminado usado por cada proveedor
- `proxy.nb-cli-root` y `proxy.upstream-host` son overrides avanzados del proxy. La mayoría de los entornos `local` o `docker` gestionados por la CLI pueden usar directamente los valores predeterminados
- Si solo quieres cambiar el driver activo del proxy, normalmente es más claro usar `nb proxy nginx use` o `nb proxy caddy use` que establecer la clave manualmente

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
