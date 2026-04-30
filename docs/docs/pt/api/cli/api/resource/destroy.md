---
title: "nb api resource destroy"
description: "Referência do comando nb api resource destroy: remove registros do recurso NocoBase especificado."
keywords: "nb api resource destroy,NocoBase CLI,remover registro,CRUD"
---

# nb api resource destroy

Remove registros do recurso especificado. Você pode usar `--filter-by-tk` ou `--filter` para localizar os registros.

## Uso

```bash
nb api resource destroy --resource <resource> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--resource` | string | Nome do recurso, obrigatório |
| `--data-source` | string | Key da fonte de dados, padrão `main` |
| `--source-id` | string | ID do registro de origem para recursos relacionados |
| `--filter-by-tk` | string | Valor da chave primária; chaves compostas ou múltiplas podem ser passadas como array JSON |
| `--filter` | string | Condição de filtro como objeto JSON |

Também aceita os parâmetros gerais de conexão de [`nb api resource`](./index.md).

## Exemplos

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Comandos relacionados

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
