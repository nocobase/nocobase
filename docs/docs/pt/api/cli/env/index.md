---
title: "nb env"
description: "Referência do comando nb env: gerencie envs salvos da NocoBase CLI, incluindo adicionar, ver o env atual, verificar status, alternar, atualizar, autenticar e remover."
keywords: "nb env,NocoBase CLI,gerenciamento de ambiente,env,current env,autenticação,OpenAPI"
---

# nb env

Gerencia envs salvos da NocoBase CLI. Um env armazena detalhes de conexão e informações de runtime local, como o endereço da API, informações de autenticação, o caminho da aplicação local e a configuração do banco de dados.

A partir desta versão, a CLI separa dois conceitos:

- `current env`: o env atualmente usado pelo shell ou runtime de agente ativo, isolado por `NB_SESSION_ID` sempre que possível
- `last env`: o último env usado globalmente, utilizado como fallback quando o modo session não está habilitado

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb env add`](./add.md) | Salva um endpoint da API do NocoBase e alterna para esse env |
| [`nb env current`](./current.md) | Mostra o env atualmente em vigor |
| [`nb env update`](./update.md) | Atualiza a configuração de um env salvo e trata automaticamente a sincronização posterior quando necessário |
| [`nb env list`](./list.md) | Lista os envs configurados |
| [`nb env status`](./status.md) | Mostra o status do env atual, de um env específico ou de todos os envs |
| [`nb env info`](./info.md) | Mostra informações detalhadas de um único env |
| [`nb env remove`](./remove.md) | Remove a configuração do env após parar o runtime gerenciado |
| [`nb env auth`](./auth.md) | Executa o login OAuth para um env salvo |
| [`nb env use`](./use.md) | Alterna o env atual |

## Exemplos

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Modo session

Por padrão, é recomendado habilitar o modo session. Isso permite que o `current env` em terminais, shells ou runtimes de agente diferentes permaneça isolado, em vez de interferir em paralelo.

Se o modo session não estiver habilitado, `nb env use` atualiza o `last env` global, e outras sessões sem isolamento por session também serão afetadas.

Veja [`nb session setup`](../session/setup.md) para saber como habilitá-lo.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
