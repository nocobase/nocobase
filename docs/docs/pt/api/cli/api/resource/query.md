---
title: "nb api resource query"
description: "Referência do comando nb api resource query: executa consultas de agregação no recurso NocoBase especificado."
keywords: "nb api resource query,NocoBase CLI,consulta de agregação,estatísticas"
---

# nb api resource query

Executa consultas de agregação no recurso especificado. `--measures`, `--dimensions` e `--orders` usam o formato de array JSON.

## Uso

```bash
nb api resource query --resource <resource> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--resource` | string | Nome do recurso, obrigatório |
| `--data-source` | string | Key da fonte de dados, padrão `main` |
| `--measures` | string | Definições de medidas como array JSON |
| `--dimensions` | string | Definições de dimensões como array JSON |
| `--orders` | string | Definições de ordenação como array JSON |
| `--filter` | string | Condição de filtro como objeto JSON |
| `--having` | string | Condição de filtro pós-agrupamento como objeto JSON |
| `--limit` | integer | Limite máximo de linhas retornadas |
| `--offset` | integer | Número de linhas a pular |
| `--timezone` | string | Fuso horário usado na formatação da consulta |

Também aceita os parâmetros gerais de conexão de [`nb api resource`](./index.md).

## Exemplos

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Comandos relacionados

- [`nb api resource list`](./list.md)
- [`nb api comandos dinâmicos`](../dynamic.md)
