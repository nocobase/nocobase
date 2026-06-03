---
title: 'nb env'
description: 'Referência do comando nb env: gerencie envs do NocoBase CLI, incluindo adicionar, ver o current env, verificar status, alternar, atualizar, autenticar e remover.'
keywords: 'nb env,NocoBase CLI,gerenciamento de ambiente,env,current env,autenticação,OpenAPI'
---

# nb env

Gerencia os envs salvos do NocoBase CLI. Um env armazena informações de conexão e de execução local, como endereço da API, informações de autenticação, caminho do aplicativo local e configuração do banco de dados.

A partir desta versão, o CLI separa dois conceitos:

- `current env`: o env atualmente usado pelo shell ou agent runtime atual, isolado por `NB_SESSION_ID` sempre que possível
- `last env`: o último env usado globalmente, usado como valor de fallback quando o modo de sessão não está habilitado

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando                          | Descrição                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`nb env add`](./add.md)         | Salva um endpoint de API do NocoBase e alterna para este env                                                       |
| [`nb env current`](./current.md) | Ver o env atualmente em vigor                                                                                      |
| [`nb env update`](./update.md)   | Atualiza a configuração de um env salvo e lida automaticamente com a sincronização subsequente conforme necessário |
| [`nb env list`](./list.md)       | Lista os envs configurados                                                                                         |
| [`nb env status`](./status.md)   | Ver o status do env atual, de um env especificado ou de todos os envs                                              |
| [`nb env info`](./info.md)       | Ver informações detalhadas de um único env                                                                         |
| [`nb env remove`](./remove.md)   | Remove a configuração do env após parar o runtime gerenciado                                                       |
| [`nb env auth`](./auth.md)       | Executa login OAuth para um env salvo                                                                              |
| [`nb env use`](./use.md)         | Alterna o env atual                                                                                                |

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

## session mode

Recomenda-se habilitar o session mode por padrão. Dessa forma, o `current env` em diferentes terminais, diferentes shells ou diferentes agent runtimes pode ficar isolado, sem afetar uns aos outros em paralelo.

Se o session mode não estiver habilitado, `nb env use` atualizará o `last env` global, e outras sessões sem isolamento de sessão também serão afetadas.

Veja [`nb session setup`](../session/setup.md) para saber como habilitá-lo.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
