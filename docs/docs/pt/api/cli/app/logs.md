---
title: "nb app logs"
description: "Referência do comando nb app logs: visualiza os logs da aplicação NocoBase do env especificado."
keywords: "nb app logs,NocoBase CLI,logs da aplicação,Docker logs,pm2 logs"
---

# nb app logs

Visualiza os logs da aplicação. Instalações npm/Git leem os logs do pm2; instalações Docker leem os logs do contêiner Docker.

## Uso

```bash
nb app logs [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI cujos logs serão visualizados; usa o env atual quando omitido |
| `--tail` | integer | Número de linhas recentes exibidas antes de seguir os logs; padrão `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Define se novos logs serão acompanhados continuamente |

## Exemplos

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
