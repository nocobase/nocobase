---
title: "nb api resource update"
description: "Referência do comando nb api resource update: atualiza registros do recurso NocoBase especificado."
keywords: "nb api resource update,NocoBase CLI,atualizar registro,CRUD"
---

# nb api resource update

Atualiza registros do recurso especificado. Você pode usar `--filter-by-tk` ou `--filter` para localizar os registros e `--values` para passar o conteúdo da atualização.

## Uso

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--resource` | string | Nome do recurso, obrigatório |
| `--data-source` | string | Key da fonte de dados, padrão `main` |
| `--source-id` | string | ID do registro de origem para recursos relacionados |
| `--filter-by-tk` | string | Valor da chave primária; chaves compostas ou múltiplas podem ser passadas como array JSON |
| `--filter` | string | Condição de filtro como objeto JSON |
| `--values` | string | Dados para atualizar o registro, objeto JSON, obrigatório |
| `--whitelist` | string[] | Campos permitidos para gravação; pode ser passado várias vezes ou como um array JSON |
| `--blacklist` | string[] | Campos proibidos para gravação; pode ser passado várias vezes ou como um array JSON |
| `--update-association-values` | string[] | Campos relacionados a atualizar simultaneamente; pode ser passado várias vezes ou como um array JSON |
| `--force-update` / `--no-force-update` | boolean | Define se valores inalterados serão gravados forçadamente |

Também aceita os parâmetros gerais de conexão de [`nb api resource`](./index.md).

## Exemplos

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Comandos relacionados

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
