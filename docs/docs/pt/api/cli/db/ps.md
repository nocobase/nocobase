---
title: "nb db ps"
description: "Referência do comando nb db ps: visualiza o estado de execução do banco de dados embutido dos envs configurados."
keywords: "nb db ps,NocoBase CLI,estado do banco de dados"
---

# nb db ps

Visualiza o estado de execução do banco de dados embutido sem iniciar ou parar nenhum recurso. Quando `--env` é omitido, exibe o estado do banco de dados de todos os envs configurados.

## Uso

```bash
nb db ps [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser visualizado; exibe todos os envs quando omitido |

## Exemplos

```bash
nb db ps
nb db ps --env app1
```

## Comandos relacionados

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
