---
title: "nb session setup"
description: "Referencia del comando nb session setup: instala integración de shell o runtime para `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,integración de shell"
---

# nb session setup

Instala la integración de sesión para `NB_SESSION_ID`.

Este comando detecta la shell actual, o usa la shell indicada con `--shell`, y escribe el archivo de inicialización correspondiente para que las nuevas sesiones de shell reciban `NB_SESSION_ID` automáticamente.

Si detecta configuración de opencode en la máquina, también escribe la integración de plugin correspondiente para que el runtime de agente pueda inyectar su propio `NB_SESSION_ID`.

## Uso


nb session setup [flags]

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Notas

En la mayoría de los casos solo necesitas ejecutarlo una vez.

Después, abre una nueva sesión de shell o recarga tu profile para que `NB_SESSION_ID` se inicialice automáticamente.

En runtimes de agente como Codex, si ya existe una variable de contexto como `CODEX_THREAD_ID`, la CLI reutiliza primero ese valor.

## Ejemplos


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Comandos relacionados

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
