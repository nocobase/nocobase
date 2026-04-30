---
title: "nb db start"
description: "Referência do comando nb db start: inicia o contêiner do banco de dados embutido do env especificado."
keywords: "nb db start,NocoBase CLI,iniciar banco de dados,Docker"
---

# nb db start

Inicia o contêiner do banco de dados embutido do env especificado. Esse comando se aplica apenas a envs com banco de dados embutido gerenciado pelo CLI habilitado.

## Uso

```bash
nb db start [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI cujo banco de dados embutido será iniciado; usa o env atual quando omitido |
| `--verbose` | boolean | Exibe a saída dos comandos Docker subjacentes |

## Exemplos

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Comandos relacionados

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
