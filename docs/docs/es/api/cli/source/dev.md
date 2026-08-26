---
title: "nb source dev"
description: "Referencia del comando nb source dev: inicia el modo de desarrollo de NocoBase en un env de origen npm o Git."
keywords: "nb source dev,NocoBase CLI,modo de desarrollo,hot reload"
---

# nb source dev

Inicia el modo de desarrollo en un env de origen npm o Git. Para los env Docker, utilice [`nb app logs`](../app/logs.md) para consultar los logs de ejecución.

## Uso

```bash
nb source dev [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env de CLI en el que entrar al modo de desarrollo; si se omite, se utiliza el env actual |
| `--db-sync` | boolean | Sincroniza la base de datos antes de iniciar el modo de desarrollo |
| `--port`, `-p` | string | Puerto del servicio de desarrollo |
| `--client`, `-c` | boolean | Inicia únicamente el cliente |
| `--server`, `-s` | boolean | Inicia únicamente el servidor |
| `--inspect`, `-i` | string | Puerto de depuración Node.js inspect en el servidor |

## Ejemplos

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Comandos relacionados

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
