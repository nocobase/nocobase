---
title: "nb api resource update"
description: "Referencia del comando nb api resource update: actualiza registros del recurso NocoBase indicado."
keywords: "nb api resource update,NocoBase CLI,actualizar registro,CRUD"
---

# nb api resource update

Actualiza registros del recurso indicado. Puede utilizar `--filter-by-tk` o `--filter` para localizar los registros y proporcionar el contenido a actualizar mediante `--values`.

## Uso

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--resource` | string | Nombre del recurso; obligatorio |
| `--data-source` | string | Clave de la fuente de datos; por defecto `main` |
| `--source-id` | string | ID del registro origen para los recursos asociados |
| `--filter-by-tk` | string | Valor de la clave primaria; para claves compuestas o múltiples puede pasar un array JSON |
| `--filter` | string | Condiciones de filtrado como objeto JSON |
| `--values` | string | Datos del registro a actualizar como objeto JSON; obligatorio |
| `--whitelist` | string[] | Campos permitidos para escritura; admite valores repetidos o un array JSON |
| `--blacklist` | string[] | Campos prohibidos para escritura; admite valores repetidos o un array JSON |
| `--update-association-values` | string[] | Campos asociados a actualizar simultáneamente; admite valores repetidos o un array JSON |
| `--force-update` / `--no-force-update` | boolean | Si forzar la escritura de valores que no han cambiado |

También admite los parámetros generales de conexión de [`nb api resource`](./index.md).

## Ejemplos

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Comandos relacionados

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
