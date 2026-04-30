---
title: "nb api"
description: "Referência do comando nb api: chamar a API do NocoBase via CLI, incluindo comandos resource genéricos e comandos dinâmicos."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Chamar a API do NocoBase via CLI. O `nb api` inclui os comandos CRUD genéricos de [`nb api resource`](./resource/index.md) e também comandos gerados dinamicamente a partir do OpenAPI Schema da aplicação atual.

## Uso

```bash
nb api <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Executa CRUD genérico e consultas de agregação em qualquer recurso do NocoBase |
| [`nb api comandos dinâmicos`](./dynamic.md) | Comandos de topic e operation gerados a partir do OpenAPI Schema da aplicação |

## Parâmetros gerais

A maioria dos comandos `nb api` aceita os seguintes parâmetros de conexão:

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--api-base-url` | string | Endereço da API do NocoBase, por exemplo `http://localhost:13000/api` |
| `--env`, `-e` | string | Nome do ambiente |
| `--token`, `-t` | string | Sobrescrita da API key |
| `--role` | string | Sobrescrita do papel, enviada no cabeçalho `X-Role` |
| `--verbose` | boolean | Exibe progresso detalhado |
| `--json-output`, `-j` / `--no-json-output` | boolean | Define se a saída JSON crua será exibida; habilitado por padrão |

## Exemplos

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Comandos relacionados

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
