---
title: "nb db"
description: "Referência do comando nb db: visualiza ou gerencia o estado de execução do banco de dados embutido do env selecionado."
keywords: "nb db,NocoBase CLI,banco de dados embutido,Docker,estado do banco de dados"
---

# nb db

Visualiza ou gerencia o banco de dados embutido gerenciado pelo CLI. Para envs sem um contêiner de banco de dados gerenciado pelo CLI, `nb db ps` também exibe estados como `external` ou `remote`.

## Uso

```bash
nb db <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb db ps`](./ps.md) | Visualiza o estado de execução do banco de dados embutido |
| [`nb db start`](./start.md) | Inicia o contêiner do banco de dados embutido |
| [`nb db stop`](./stop.md) | Para o contêiner do banco de dados embutido |
| [`nb db logs`](./logs.md) | Visualiza os logs do contêiner do banco de dados embutido |

## Exemplos

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
