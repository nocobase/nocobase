---
title: "nb scaffold"
description: "Referência do comando nb scaffold: gera o scaffold de plugins e scripts de migration do NocoBase."
keywords: "nb scaffold,NocoBase CLI,scaffold,plugin,migration"
---

# nb scaffold

Gera o scaffold relacionado ao desenvolvimento de plugins do NocoBase.

## Uso

```bash
nb scaffold <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Gera o scaffold de um plugin do NocoBase |
| [`nb scaffold migration`](./migration.md) | Gera um script de migration de plugin |

## Exemplos

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Comandos relacionados

- [`nb plugin`](../plugin/index.md)
- [Desenvolvimento de plugins](../../../plugin-development/index.md)
