---
title: "nb config"
description: "Referencia del comando nb config: gestionar la configuración predeterminada del CLI."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Gestiona la configuración predeterminada del CLI. Claves compatibles actualmente:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

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
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
