---
title: "nb scaffold plugin"
description: "Referência do comando nb scaffold plugin: gera o scaffold de um plugin do NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold de plugin"
---

# nb scaffold plugin

Gera o código do scaffold de um plugin do NocoBase.

## Uso

```bash
nb scaffold plugin <pkg> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<pkg>` | string | Nome do pacote do plugin, obrigatório |
| `--force-recreate`, `-f` | boolean | Força a recriação do scaffold do plugin |

## Exemplos

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Comandos relacionados

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
