---
title: "nb license id"
description: "Referencia del comando nb license id: mostrar o regenerar el ID de instancia de licencia comercial para un env seleccionado."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Muestra el ID de instancia de la licencia comercial del env seleccionado. Si todavía no existe un ID de instancia guardado, el CLI lo genera y lo guarda automáticamente.

## Uso

```bash
nb license id [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--force` | boolean | Regenerar el ID de instancia incluso si ya existe uno guardado |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license id
nb license id --env app1
nb license id --env app1 --force
nb license id --env app1 --json
```

## Comandos relacionados

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
