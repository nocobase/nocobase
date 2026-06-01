---
title: "nb config"
description: "Referencia del comando nb config: gestionar los elementos de configuración predeterminados del CLI de NocoBase."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Gestiona la configuración predeterminada del CLI. Claves compatibles actualmente:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Claves comunes

| Clave | Valor predeterminado | Descripción |
| --- | --- | --- |
| `locale` | resolución actual del locale del CLI | Sobrescribe el idioma usado por el CLI |
| `update.policy` | `prompt` | Comportamiento de actualización al iniciar: `prompt`, `auto` u `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Registro de paquetes para paquetes comerciales |
| `docker.network` | `nocobase` | Red de Docker predeterminada usada por las aplicaciones Docker gestionadas por el CLI |
| `docker.container-prefix` | `nb` | Prefijo de contenedor predeterminado usado por las aplicaciones Docker gestionadas por el CLI |
| `bin.docker` | `docker` | Sobrescribe la ruta del ejecutable de Docker |
| `bin.git` | `git` | Sobrescribe la ruta del ejecutable de Git |
| `bin.yarn` | `yarn` | Sobrescribe la ruta del ejecutable de Yarn |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb config get`](./get.md) | Obtener el valor efectivo de una clave de configuración |
| [`nb config set`](./set.md) | Establecer un valor de configuración |
| [`nb config delete`](./delete.md) | Eliminar un valor configurado explícitamente |
| [`nb config list`](./list.md) | Listar los valores configurados explícitamente |

## Ejemplos

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
