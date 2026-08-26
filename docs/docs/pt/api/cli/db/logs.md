---
title: "nb db logs"
description: "Referência do comando nb db logs: visualiza os logs do contêiner do banco de dados embutido do env especificado."
keywords: "nb db logs,NocoBase CLI,logs do banco de dados,Docker logs"
---

# nb db logs

Visualiza os logs do contêiner do banco de dados embutido do env especificado. Esse comando se aplica apenas a envs com banco de dados embutido gerenciado pelo CLI habilitado.

## Uso

```bash
nb db logs [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI cujos logs do banco de dados embutido serão visualizados; usa o env atual quando omitido |
| `--tail` | integer | Número de linhas recentes exibidas antes de seguir os logs; padrão `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Define se novos logs serão acompanhados continuamente |

## Exemplos

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Comandos relacionados

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
