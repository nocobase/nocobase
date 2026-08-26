---
title: 'nb env info'
description: 'Referência do comando nb env info: veja a configuração do app, banco de dados, API e autenticação do env especificado no NocoBase CLI.'
keywords: 'nb env info,NocoBase CLI,detalhes do ambiente,configuração'
---

# nb env info

Veja informações detalhadas de um único env, incluindo configuração do app, banco de dados, API e autenticação.

## Uso

```bash
nb env info [name] [flags]
```

## Parâmetros

| Parâmetro        | Tipo    | Descrição                                                                                               |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `[name]`         | string  | Nome do ambiente configurado a ser visualizado; quando omitido, usa o env atual                         |
| `--json`         | boolean | Saída em JSON                                                                                           |
| `--field`        | string  | Retorna apenas um campo, usando um caminho com pontos, como `app.url`, `app.appPath` ou `api.auth.type` |
| `--show-secrets` | boolean | Exibe tokens, senhas e outros segredos em texto simples                                                 |

## Exemplos

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
