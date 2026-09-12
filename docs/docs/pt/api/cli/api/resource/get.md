---
title: "nb api resource get"
description: "Referência do comando nb api resource get: obtém um único registro do recurso NocoBase especificado."
keywords: "nb api resource get,NocoBase CLI,obter registro,chave primária"
---

# nb api resource get

Obtém um único registro do recurso especificado. Geralmente é usado `--filter-by-tk` para indicar a chave primária.

## Uso

```bash
nb api resource get --resource <resource> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--resource` | string | Nome do recurso, obrigatório |
| `--data-source` | string | Key da fonte de dados, padrão `main` |
| `--source-id` | string | ID do registro de origem para recursos relacionados |
| `--filter-by-tk` | string | Valor da chave primária; chaves compostas ou múltiplas podem ser passadas como array JSON |
| `--fields` | string[] | Campos para consulta; pode ser passado várias vezes ou como um array JSON |
| `--appends` | string[] | Campos relacionados a anexar; pode ser passado várias vezes ou como um array JSON |
| `--except` | string[] | Campos a excluir; pode ser passado várias vezes ou como um array JSON |

Também aceita os parâmetros gerais de conexão de [`nb api resource`](./index.md).

## Exemplos

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Comandos relacionados

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
