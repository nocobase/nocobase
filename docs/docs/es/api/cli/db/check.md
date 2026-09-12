---
title: "nb db check"
description: "Referencia del comando nb db check: comprobar si una base de datos es accesible con el env actual o con flags explícitos de base de datos."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Comprueba si una base de datos es accesible. Puede reutilizar la configuración de base de datos guardada en un env o pasar flags `--db-*` explícitos.

## Uso

```bash
nb db check [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Leer la configuración de base de datos desde un env del CLI; si se omite, deben proporcionarse todos los flags `--db-*` requeridos |
| `--db-dialect` | string | Dialecto de base de datos: `postgres`, `kingbase`, `mysql` o `mariadb` |
| `--db-host` | string | Nombre del host o dirección IP de la base de datos |
| `--db-port` | string | Puerto TCP de la base de datos |
| `--db-database` | string | Nombre de la base de datos |
| `--db-user` | string | Nombre de usuario de la base de datos |
| `--db-password` | string | Contraseña de la base de datos |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Notas

Si el env seleccionado utiliza una base de datos integrada administrada por el CLI, el CLI resuelve la dirección de conexión real antes de ejecutar la comprobación.

## Comandos relacionados

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
