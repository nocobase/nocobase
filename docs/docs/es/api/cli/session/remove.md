---
title: "nb session remove"
description: "Referencia del comando nb session remove: elimina la integración de shell o runtime para `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,eliminar integración de sesión"
---

# nb session remove

Elimina la integración de sesión para `NB_SESSION_ID`.

Este comando limpia la configuración de shell escrita previamente por [`nb session setup`](./setup.md). Si detecta integración del plugin de opencode, también elimina esa integración.

## Uso


nb session remove [flags]

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Ejemplos


nb session remove
nb session remove --shell zsh

## Comandos relacionados

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
