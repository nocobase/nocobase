---
title: "nb session remove"
description: "Referência do comando nb session remove: remove a integração de shell ou runtime para `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,remover integração de sessão"
---

# nb session remove

Remove a integração de sessão para `NB_SESSION_ID`.

Este comando limpa a configuração de shell gravada anteriormente por [`nb session setup`](./setup.md). Se uma integração de plugin do opencode for detectada, ela também será removida.

## Uso


nb session remove [flags]

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Exemplos


nb session remove
nb session remove --shell zsh

## Comandos relacionados

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
