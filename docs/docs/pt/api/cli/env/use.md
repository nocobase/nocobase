---
title: "nb env use"
description: "Referência do comando nb env use: alterna o env atual do NocoBase CLI."
keywords: "nb env use,NocoBase CLI,alternar ambiente,current env"
---

# nb env use

Alterna o env atual do CLI. Depois disso, comandos sem `--env` passam a usar esse env por padrão.

## Uso

```bash
nb env use <name>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<name>` | string | Nome de um ambiente já configurado |

## Exemplos

```bash
nb env use local
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
