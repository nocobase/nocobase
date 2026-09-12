---
title: 'nb backup create'
description: 'Referencia del comando nb backup create: crea una copia de seguridad mediante el env seleccionado y descarga el archivo de copia de seguridad en local.'
keywords: 'nb backup create,NocoBase CLI,crear copia de seguridad,descargar copia de seguridad,nbdata'
---

# nb backup create

Crea una copia de seguridad mediante el env seleccionado y descarga el archivo de copia de seguridad en local. Cuando se omite `--output`, el CLI guarda el archivo en el directorio de trabajo actual y reutiliza el nombre de archivo de copia de seguridad devuelto por el remoto; normalmente es `backup_*.nbdata`.

## Uso

```bash
nb backup create [flags]
```

## Parámetros

| Parámetro             | Tipo    | Descripción                                                                                                                                                                                      |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--env`, `-e`         | string  | Nombre del env de CLI para el que se va a crear la copia de seguridad; si se omite, se usa el env actual                                                                                         |
| `--yes`, `-y`         | boolean | Omite la confirmación interactiva cuando el env señalado explícitamente por `--env` no coincide con el env actual                                                                                |
| `--output`, `-o`      | string  | Ruta de destino de la descarga. Si se omite, se guarda en el directorio actual; si apunta a un directorio existente, se añade automáticamente el nombre del archivo de copia de seguridad remoto |
| `--json-output`, `-j` | boolean | Muestra el resultado final en JSON, con los campos `env`, `name` y `output`                                                                                                                      |

## Ejemplos

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Descripción

El CLI solo comprueba si `--env` coincide con el env actual cuando pasas `--env` explícitamente. Si se especifica explícitamente un env diferente, primero se pedirá confirmación en un terminal interactivo; en un terminal no interactivo o en un escenario con AI agent, debes añadir `--yes` explícitamente tú mismo, o ejecutar primero `nb env use <name>` y volver a intentarlo.

El flujo de creación se divide en dos pasos: primero llama a la API de backup del env de destino para crear la copia de seguridad remota, y luego consulta el estado cada 2 segundos; cuando la copia de seguridad se completa, descarga el archivo en local. Si después de 600 segundos el remoto sigue devolviendo `inProgress: true`, el comando finaliza por tiempo de espera.

`--output` puede ser tanto una ruta de archivo como la ruta de un directorio existente. El CLI solo reconoce como directorio una ruta que ya existe; si la ruta no existe, se tratará como ruta del archivo de destino.

Después de pasar `--json-output`, el CLI deja de mostrar texto de progreso y en su lugar imprime directamente el resultado JSON final. Este modo es más adecuado para seguir siendo consumido por scripts y flujos de agent.

## Comandos relacionados

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
