---
title: "nb api resource"
description: "Referência do comando nb api resource: executa CRUD genérico e consultas de agregação em qualquer recurso do NocoBase."
keywords: "nb api resource,NocoBase CLI,CRUD,recurso,tabela"
---

# nb api resource

Executa CRUD genérico e consultas de agregação em qualquer recurso do NocoBase. O nome do recurso pode ser um recurso comum, por exemplo `users`, ou um recurso relacionado, por exemplo `posts.comments`.

## Uso

```bash
nb api resource <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb api resource list`](./list.md) | Lista os registros do recurso |
| [`nb api resource get`](./get.md) | Obtém um único registro do recurso |
| [`nb api resource create`](./create.md) | Cria um registro no recurso |
| [`nb api resource update`](./update.md) | Atualiza um registro do recurso |
| [`nb api resource destroy`](./destroy.md) | Remove um registro do recurso |
| [`nb api resource query`](./query.md) | Executa uma consulta de agregação |

## Parâmetros gerais

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--api-base-url` | string | Endereço da API do NocoBase, por exemplo `http://localhost:13000/api` |
| `--verbose` | boolean | Exibe progresso detalhado |
| `--env`, `-e` | string | Nome do ambiente |
| `--role` | string | Sobrescrita do papel, enviada no cabeçalho `X-Role` |
| `--token`, `-t` | string | Sobrescrita da API key |
| `--json-output`, `-j` / `--no-json-output` | boolean | Define se a saída JSON crua será exibida; habilitado por padrão |
| `--resource` | string | Nome do recurso, obrigatório, por exemplo `users`, `orders`, `posts.comments` |
| `--data-source` | string | Key da fonte de dados, padrão `main` |

Comandos de recursos relacionados podem ser combinados com `--source-id` para indicar o ID do registro de origem.

## Exemplos

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Comandos relacionados

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
