---
title: "nb db stop"
description: "Referência do comando nb db stop: para o contêiner do banco de dados embutido do env especificado."
keywords: "nb db stop,NocoBase CLI,parar banco de dados,Docker"
---

# nb db stop

Para o contêiner do banco de dados embutido do env especificado. Esse comando se aplica apenas a envs com banco de dados embutido gerenciado pelo CLI habilitado.

## Uso

```bash
nb db stop [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI cujo banco de dados embutido será parado; usa o env atual quando omitido |
| `--verbose` | boolean | Exibe a saída dos comandos Docker subjacentes |

## Exemplos

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Comandos relacionados

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
