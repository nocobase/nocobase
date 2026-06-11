---
title: "nb api resource create"
description: "Referência do comando nb api resource create: cria um registro no recurso NocoBase especificado."
keywords: "nb api resource create,NocoBase CLI,criar registro,CRUD"
---

# nb api resource create

Cria um registro no recurso especificado. O conteúdo do registro é passado como objeto JSON via `--values`.

## Uso

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--resource` | string | Nome do recurso, obrigatório |
| `--data-source` | string | Key da fonte de dados, padrão `main` |
| `--source-id` | string | ID do registro de origem para recursos relacionados |
| `--values` | string | Dados para criar o registro, objeto JSON, obrigatório |
| `--whitelist` | string[] | Campos permitidos para gravação; pode ser passado várias vezes ou como um array JSON |
| `--blacklist` | string[] | Campos proibidos para gravação; pode ser passado várias vezes ou como um array JSON |

Também aceita os parâmetros gerais de conexão de [`nb api resource`](./index.md).

## Exemplos

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Comandos relacionados

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
