---
title: "nb api"
description: "Referencia del comando nb api: invocar la API de NocoBase a través del CLI, incluyendo los comandos genéricos de resource y los comandos dinámicos."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Invoca la API de NocoBase a través del CLI. `nb api` incluye los comandos CRUD genéricos [`nb api resource`](./resource/index.md), así como comandos generados dinámicamente a partir del esquema OpenAPI de la aplicación actual.

## Uso

```bash
nb api <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Ejecutar operaciones CRUD genéricas y consultas agregadas sobre cualquier recurso de NocoBase |
| [`nb api comandos dinámicos`](./dynamic.md) | Comandos de topic y operación generados a partir del esquema OpenAPI de la aplicación |

## Parámetros generales

La mayoría de los comandos `nb api` admiten los siguientes parámetros de conexión:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--api-base-url` | string | Dirección de la API de NocoBase, por ejemplo `http://localhost:13000/api` |
| `--env`, `-e` | string | Nombre del entorno |
| `--token`, `-t` | string | Sobrescritura de la API key |
| `--role` | string | Sobrescritura del rol; se envía como cabecera `X-Role` |
| `--verbose` | boolean | Mostrar el progreso detallado |
| `--json-output`, `-j` / `--no-json-output` | boolean | Si devolver JSON sin procesar; activado por defecto |

## Ejemplos

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Comandos relacionados

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
