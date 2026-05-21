---
title: "nb app down"
description: "Referencia del comando nb app down: detiene y limpia los recursos de ejecución locales del env indicado."
keywords: "nb app down,NocoBase CLI,limpiar recursos,eliminar contenedor,storage"
---

# nb app down

Detiene y limpia los recursos de ejecución locales del env indicado. Por defecto, conserva los datos de storage y la configuración del env; para eliminar todo el contenido es obligatorio pasar explícitamente `--all --force`.

## Uso

```bash
nb app down [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI a limpiar; si se omite, se utiliza el env actual |
| `--all` | boolean | Eliminar todo el contenido del env, incluidos los datos de storage y la configuración guardada |
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--force`, `-f` | boolean | Fuerza una limpieza destructiva, como `--all` u otras limpiezas de alto riesgo en modo no interactivo |
| `--verbose` | boolean | Mostrar la salida de los comandos subyacentes de detención y limpieza |

## Ejemplos

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` solo omite la confirmación interactiva cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual. `--force` se usa para forzar de verdad una limpieza destructiva, como `--all` u otras limpiezas de alto riesgo en modo no interactivo.

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
