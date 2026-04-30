---
title: "nb api resource"
description: "Referencia del comando nb api resource: ejecuta operaciones CRUD genéricas y consultas agregadas sobre cualquier recurso de NocoBase."
keywords: "nb api resource,NocoBase CLI,CRUD,recurso,tabla de datos"
---

# nb api resource

Ejecuta operaciones CRUD genéricas y consultas agregadas sobre cualquier recurso de NocoBase. El nombre del recurso puede ser un recurso simple, por ejemplo `users`, o un recurso asociado, por ejemplo `posts.comments`.

## Uso

```bash
nb api resource <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb api resource list`](./list.md) | Listar registros del recurso |
| [`nb api resource get`](./get.md) | Obtener un único registro del recurso |
| [`nb api resource create`](./create.md) | Crear un registro en el recurso |
| [`nb api resource update`](./update.md) | Actualizar registros del recurso |
| [`nb api resource destroy`](./destroy.md) | Eliminar registros del recurso |
| [`nb api resource query`](./query.md) | Ejecutar consultas agregadas |

## Parámetros generales

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--api-base-url` | string | Dirección de la API de NocoBase, por ejemplo `http://localhost:13000/api` |
| `--verbose` | boolean | Mostrar el progreso detallado |
| `--env`, `-e` | string | Nombre del entorno |
| `--role` | string | Sobrescritura del rol; se envía como cabecera `X-Role` |
| `--token`, `-t` | string | Sobrescritura de la API key |
| `--json-output`, `-j` / `--no-json-output` | boolean | Si devolver JSON sin procesar; activado por defecto |
| `--resource` | string | Nombre del recurso; obligatorio, por ejemplo `users`, `orders`, `posts.comments` |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |

Los comandos sobre recursos asociados también pueden combinarse con `--source-id` para indicar el ID del registro origen.

## Ejemplos

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Comandos relacionados

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
