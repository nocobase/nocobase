---
title: "nb session"
description: "Referência do comando nb session: configura e inspeciona `NB_SESSION_ID` para isolar o env atual por shell ou runtime de agente."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

Gerencia o session mode para `NB_SESSION_ID`.

Depois que o session mode é habilitado, `nb env use` e `nb env current` passam a usar primeiro o contexto atual do shell ou runtime de agente, em vez de compartilhar diretamente um único current env global.

## Uso


nb session <command>

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb session setup`](./setup.md) | Instala a integração de shell ou runtime para `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Mostra o id de sessão efetivo atual |
| [`nb session remove`](./remove.md) | Remove a integração de shell ou runtime para `NB_SESSION_ID` |

## Quando você precisa disso

A recomendação padrão é executar `nb session setup` uma vez quando você começar a usar a CLI. Com isso:

- o terminal 1 pode usar `env1`
- o terminal 2 pode usar `env2` ao mesmo tempo
- um runtime de agente também pode manter seu próprio current env

Sem session mode, sessões diferentes acabam compartilhando o `last env` global como fallback, o que facilita interferências no trabalho em paralelo.

## Comandos relacionados

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
