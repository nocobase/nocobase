---
title: "nb env update"
description: "Referencia del comando nb env update: actualiza el OpenAPI Schema y la caché de comandos en tiempo de ejecución del env especificado."
keywords: "nb env update,NocoBase CLI,OpenAPI,comandos en tiempo de ejecución,swagger"
---

# nb env update

Actualiza el OpenAPI Schema desde la aplicación NocoBase y refresca la caché local de comandos en tiempo de ejecución. La caché se almacena en `.nocobase/versions/<hash>/commands.json`.

## Uso

```bash
nb env update [name] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del entorno; si se omite, se utiliza el env actual |
| `--verbose` | boolean | Muestra el progreso detallado |
| `--api-base-url` | string | Sobrescribe la dirección de la API de NocoBase y la persiste en el env de destino |
| `--role` | string | Sobrescribe el rol; se envía como cabecera `X-Role` |
| `--token`, `-t` | string | Sobrescribe la API key y la persiste en el env de destino |

## Ejemplos

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Comandos relacionados

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
