---
title: "nb license plugins sync"
description: "Referencia del comando nb license plugins sync: sincronizar los plugins comerciales permitidos por la licencia actual para un env seleccionado."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Sincroniza los plugins comerciales permitidos por la licencia actual.

## Uso

```bash
nb license plugins sync [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--env`, `-e` | string | Nombre del env del CLI; si se omite, se usa el env actual |
| `--dry-run` | boolean | Previsualizar cambios sin instalar, actualizar ni eliminar plugins |
| `--version` | string | Versión del registry o dist-tag que se sincronizará; por defecto se usa la versión actual del workspace |
| `--verbose`, `-V` | boolean | Mostrar logs detallados por plugin |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Notas

Cuando se omite `--version`, el CLI detecta automáticamente la versión actual de la aplicación y la utiliza para determinar qué versión del registry de plugins comerciales debe descargarse.

## Comandos relacionados

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
