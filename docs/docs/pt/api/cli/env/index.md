---
title: "nb env"
description: "Referência do comando nb env: gerencia envs do NocoBase CLI, incluindo adicionar, visualizar o env atual, verificar status, alternar, autenticar e remover."
keywords: "nb env,NocoBase CLI,gerenciamento de ambiente,env,env atual,autenticação,OpenAPI"
---

# nb env

Gerencia os envs do NocoBase CLI já salvos. O env armazena o endereço da API, informações de autenticação, caminhos da aplicação local, configuração do banco de dados e o cache de comandos em tempo de execução.

No modelo atual, a CLI separa dois conceitos:

- `current env`: o env usado pelo shell ou runtime de agente ativo, isolado por `NB_SESSION_ID` quando disponível
- `last env`: o último env usado globalmente, usado como fallback quando o session mode não está habilitado

## Uso


nb env <command>

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb env add`](./add.md) | Salva um endpoint da API NocoBase e alterna para esse env |
| [`nb env current`](./current.md) | Mostra o env atualmente efetivo |
| [`nb env update`](./update.md) | Atualiza o OpenAPI Schema e o cache de comandos em tempo de execução a partir da aplicação |
| [`nb env list`](./list.md) | Lista os envs configurados |
| [`nb env status`](./status.md) | Mostra o status do env atual, de um env ou de todos os envs |
| [`nb env info`](./info.md) | Visualiza as informações detalhadas de um env específico |
| [`nb env remove`](./remove.md) | Interrompe o runtime gerenciado, se existir, e depois remove a configuração do env |
| [`nb env auth`](./auth.md) | Executa o login OAuth para um env já salvo |
| [`nb env use`](./use.md) | Alterna o env atual |

## Exemplos


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Session mode

Session mode é a recomendação padrão. Ele mantém `current env` isolado entre diferentes terminais, shells e runtimes de agente, para que o trabalho em paralelo não se afete.

Quando o session mode não está habilitado, `nb env use` atualiza o `last env` global, e outras sessões sem isolamento também podem ser afetadas.

Ative com [`nb session setup`](../session/setup.md).

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
