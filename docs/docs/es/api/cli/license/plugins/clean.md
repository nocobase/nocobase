---
title: "nb license plugins clean"
description: "Referencia del comando nb license plugins clean: eliminar los plugins comerciales descargados para un env seleccionado."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Elimina los plugins comerciales descargados del env seleccionado sin modificar la activación de la licencia.

## Uso

```bash
nb license plugins clean [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--dry-run` | boolean | Previsualizar qué plugins se eliminarían sin borrar nada |
| `--verbose`, `-V` | boolean | Mostrar logs detallados por plugin |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## Comandos relacionados

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
