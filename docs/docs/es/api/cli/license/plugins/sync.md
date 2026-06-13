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
| `--yes`, `-y` | boolean | Cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva |
| `--dry-run` | boolean | Previsualizar cambios sin instalar, actualizar ni eliminar plugins |
| `--version` | string | Versión del registry o dist-tag que se sincronizará; por defecto se usa la versión actual del workspace |
| `--skip-if-no-license` | boolean | Omitir sin error cuando el env actual todavía no tenga una licencia guardada |
| `--verbose` | boolean | Mostrar logs detallados por plugin |
| `--json` | boolean | Salida en JSON |

## Ejemplos

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Notas

Cuando se omite `--version`, el CLI detecta automáticamente la versión actual de la aplicación y la utiliza para determinar qué versión del registry de plugins comerciales debe descargarse.

`--skip-if-no-license` solo ignora un caso: que el env actual todavía no tenga una licencia guardada. Otros errores, como credenciales del registry ausentes en la licencia, errores al iniciar sesión en el registry o errores al descargar plugins, seguirán mostrándose con normalidad.

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
