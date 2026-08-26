---
title: "nb session setup"
description: "Referência do comando nb session setup: instala a integração de shell ou runtime para `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,integração de shell"
---

# nb session setup

Instala a integração de sessão para `NB_SESSION_ID`.

Este comando detecta o shell atual, ou usa o shell informado com `--shell`, e grava o arquivo de inicialização correspondente para que novas sessões de shell recebam `NB_SESSION_ID` automaticamente.

Se uma configuração do opencode for detectada na máquina, ele também grava a integração de plugin correspondente para que o runtime de agente possa injetar seu próprio `NB_SESSION_ID`.

## Uso


nb session setup [flags]

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Notas

Na maioria dos casos, você só precisa executar este comando uma vez.

Depois disso, abra uma nova sessão de shell ou recarregue seu profile para que `NB_SESSION_ID` seja inicializado automaticamente.

Em runtimes de agente como Codex, se já existir uma variável de contexto como `CODEX_THREAD_ID`, a CLI reutiliza esse valor primeiro.

## Exemplos


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Comandos relacionados

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
