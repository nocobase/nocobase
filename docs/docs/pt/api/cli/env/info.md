---
title: "nb env info"
description: "Referência do comando nb env info: visualiza as configurações de aplicação, banco de dados, API e autenticação de um env específico do NocoBase CLI."
keywords: "nb env info,NocoBase CLI,detalhes do ambiente,configuração"
---

# nb env info

Visualiza as informações detalhadas de um env específico, incluindo as configurações de aplicação, banco de dados, API e autenticação.

## Uso

```bash
nb env info [name] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do ambiente configurado a ser consultado; quando omitido, usa o env atual |
| `--json` | boolean | Saída em JSON |
| `--show-secrets` | boolean | Exibe token, senha e outros segredos em texto plano |

## Exemplos

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
