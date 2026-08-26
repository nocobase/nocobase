---
title: "nb scaffold migration"
description: "Referência do comando nb scaffold migration: gera scripts de migration para plugins do NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,script de migration,migration"
---

# nb scaffold migration

Gera o arquivo de script de migration de um plugin.

## Uso

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<name>` | string | Nome do script de migration, obrigatório |
| `--pkg` | string | Nome do pacote do plugin ao qual pertence, obrigatório |
| `--on` | string | Momento de execução: `beforeLoad`, `afterSync` ou `afterLoad` |

## Exemplos

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Comandos relacionados

- [`nb scaffold plugin`](./plugin.md)
- [Desenvolvimento de plugins](../../../plugin-development/index.md)
