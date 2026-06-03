---
title: 'nb config'
description: 'Referencia del comando nb config: administra los elementos de configuración predeterminados de NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,configuración,configuración predeterminada'
---

# nb config

Administra la configuración predeterminada de la CLI. Los elementos de configuración compatibles actualmente incluyen:

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Elementos de configuración comunes

| Elemento de configuración | Valor predeterminado                            | Descripción                                                                  |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `locale`                  | Se resuelve según las reglas actuales de la CLI | Sobrescribe el idioma usado por la CLI                                       |
| `update.policy`           | `prompt`                                        | Política de actualización al iniciar: `prompt`, `auto` o `off`               |
| `docker.network`          | `nocobase`                                      | Red predeterminada para las aplicaciones Docker administradas por la CLI     |
| `docker.container-prefix` | `nb`                                            | Prefijo predeterminado para los contenedores Docker administrados por la CLI |
| `bin.docker`              | `docker`                                        | Sobrescribe la ruta del ejecutable de Docker                                 |
| `bin.git`                 | `git`                                           | Sobrescribe la ruta del ejecutable de Git                                    |
| `bin.yarn`                | `yarn`                                          | Sobrescribe la ruta del ejecutable de Yarn                                   |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando                           | Descripción                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------ |
| [`nb config get`](./get.md)       | Lee el valor efectivo de un elemento de configuración                          |
| [`nb config set`](./set.md)       | Establece un elemento de configuración                                         |
| [`nb config delete`](./delete.md) | Elimina un elemento configurado explícitamente                                 |
| [`nb config list`](./list.md)     | Muestra los elementos de configuración establecidos explícitamente actualmente |

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
