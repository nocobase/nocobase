---
title: "nb env"
description: "Referência do comando nb env: gerencia o env do NocoBase CLI, incluindo adicionar, atualizar, visualizar, alternar, autenticar e remover."
keywords: "nb env,NocoBase CLI,gerenciamento de ambiente,env,autenticação,OpenAPI"
---

# nb env

Gerencia os env do NocoBase CLI já salvos. O env armazena o endereço da API, informações de autenticação, caminho da aplicação local, configuração do banco de dados e o cache de comandos em tempo de execução.

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb env add`](./add.md) | Salva um endpoint da API NocoBase e o define como env atual |
| [`nb env update`](./update.md) | Atualiza o OpenAPI Schema e o cache de comandos em tempo de execução a partir da aplicação |
| [`nb env list`](./list.md) | Lista os env configurados e o status de autenticação da API |
| [`nb env info`](./info.md) | Visualiza as informações detalhadas de um env específico |
| [`nb env remove`](./remove.md) | Remove a configuração de um env |
| [`nb env auth`](./auth.md) | Executa o login OAuth para um env já salvo |
| [`nb env use`](./use.md) | Alterna o env atual |

## Exemplos

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
