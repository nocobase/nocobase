---
title: "nb config delete"
description: "Referencia del comando nb config delete: eliminar una configuración explícita del CLI."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Elimina una configuración explícita del CLI. Después, el CLI vuelve al valor predeterminado de esa clave.

## Uso

```bash
nb config delete <key>
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<key>` | string | Clave de configuración: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` o `bin.yarn` |

## Ejemplos

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
