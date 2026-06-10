---
title: "nb config delete"
description: "Referencia del comando nb config delete: eliminar un elemento de configuración de la CLI establecido explícitamente."
keywords: "nb config delete,NocoBase CLI,eliminar configuración"
---

# nb config delete

Elimina un elemento de configuración de la CLI que se haya establecido explícitamente. Después de eliminarlo, ese elemento vuelve a su valor predeterminado.

## Uso

```bash
nb config delete <key>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<key>` | string | Nombre del elemento de configuración. Consulta [`nb config`](./index.md) para ver los valores admitidos |

## Ejemplos

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
