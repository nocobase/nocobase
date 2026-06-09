---
title: 'nb app stop'
description: 'Referencia del comando nb app stop: detiene la aplicación de NocoBase del env especificado y, si es necesario, también limpia el contenedor de base de datos integrada administrado por la CLI.'
keywords: 'nb app stop,NocoBase CLI,detener aplicación,Docker,with-db,base de datos integrada'
---

# nb app stop

Detiene la aplicación de NocoBase del env especificado. En instalaciones con npm/Git, detiene el proceso local de la aplicación; en instalaciones con Docker, limpia el contenedor de la aplicación guardado.

Si pasas `--with-db` y este env usa una base de datos integrada administrada por la CLI, el comando también limpiará el contenedor de la base de datos. Si este env usa una base de datos externa, los recursos de la base de datos no se tocarán.

## Uso

```bash
nb app stop [flags]
```

## Parámetros

| Parámetro     | Tipo    | Descripción                                                                                                        |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `--env`, `-e` | string  | Nombre del env de CLI que se va a detener; si se omite, se usa el env actual                                       |
| `--yes`, `-y` | boolean | Omite la confirmación interactiva cuando el env indicado explícitamente por `--env` es distinto del env actual     |
| `--with-db`   | boolean | También limpia el contenedor de la base de datos cuando existe una base de datos integrada administrada por la CLI |
| `--verbose`   | boolean | Muestra la salida de los comandos subyacentes locales o de Docker                                                  |

## Ejemplos

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Descripción

La CLI solo comprobará si el env especificado coincide con el env actual cuando pases `--env` explícitamente. Si especificas explícitamente un env diferente, primero se pedirá confirmación en un terminal interactivo; en un terminal no interactivo o en escenarios con agentes de IA, debes añadir `--yes` explícitamente por tu cuenta, o ejecutar primero `nb env use <name>` y volver a intentarlo.

`--with-db` solo afecta a los contenedores de base de datos integrada administrados por la CLI. Normalmente, si solo quieres detener la propia aplicación, no necesitas este parámetro; añádelo solo cuando también quieras detener el entorno de ejecución de la base de datos integrada en la máquina actual.

Este comando solo puede operar sobre runtimes local o Docker en la máquina actual. Si un env es solo una conexión HTTP API, o es un env SSH reservado, `nb app stop` no puede detenerlo remotamente por ti.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
