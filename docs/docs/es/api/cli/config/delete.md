---
title: 'nb config delete'
description: 'Referencia del comando nb config delete: elimina un elemento de configuración de CLI establecido explícitamente.'
keywords: 'nb config delete,NocoBase CLI,eliminar configuración'
---

# nb config delete

Elimina un elemento de configuración de CLI establecido explícitamente. Después de eliminarlo, el elemento vuelve a su valor predeterminado.

## Uso

```bash
nb config delete <key>
```

## Parámetros

| Parámetro | Tipo   | Descripción                                                                                                                                        |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nombre del elemento de configuración: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` o `bin.yarn` |

## Ejemplos

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
