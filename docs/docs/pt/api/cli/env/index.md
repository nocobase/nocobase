---
title: 'nb env'
description: 'Referência do comando nb env: gerencie envs do NocoBase CLI, incluindo adicionar, ver o env atual, verificar status, trocar, atualizar, gerar proxy, autenticar e remover.'
keywords: 'nb env,NocoBase CLI,gerenciamento de ambiente,env,current env,proxy,autenticação,OpenAPI'
---

# nb env

Gerencie envs salvos do NocoBase CLI. Um env guarda informações de conexão e de runtime local, como endereço da API, autenticação, caminho local do app e configuração do banco de dados.

A partir desta versão, a CLI separa dois conceitos:

- `current env`: o env usado pelo shell ou agent runtime atual, isolado por `NB_SESSION_ID` quando possível
- `last env`: o último env usado globalmente, usado como fallback quando o session mode não está ativado

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb env add`](./add.md) | Salva um endpoint da API do NocoBase e troca para esse env |
| [`nb env current`](./current.md) | Mostra o env atualmente efetivo |
| [`nb env update`](./update.md) | Atualiza a configuração salva de um env e executa a sincronização necessária |
| [`nb env list`](./list.md) | Lista os envs configurados |
| [`nb env status`](./status.md) | Mostra o status do env atual, de um env específico ou de todos |
| [`nb env info`](./info.md) | Mostra detalhes de um único env |
| [`nb env proxy`](./proxy/index.md) | Mostra os subcomandos de proxy e gera configurações Nginx ou Caddy para um env gerenciado |
| [`nb env remove`](./remove.md) | Remove a configuração do env depois de parar o runtime gerenciado |
| [`nb env auth`](./auth.md) | Executa o login OAuth para um env salvo |
| [`nb env use`](./use.md) | Troca o env atual |

## Exemplos

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env proxy nginx --env app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

Por padrão, é recomendado ativar o session mode. Assim, o `current env` em terminais, shells ou agent runtimes diferentes fica isolado e não interfere em execuções paralelas.

Se o session mode não estiver ativo, `nb env use` atualiza o `last env` global, e outras sessões sem isolamento também serão afetadas.

Veja [`nb session setup`](../session/setup.md) para ativar.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
