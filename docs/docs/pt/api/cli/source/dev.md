---
title: "nb source dev"
description: "Referência do comando nb source dev: inicia o modo de desenvolvimento do NocoBase em um env de origem npm ou Git."
keywords: "nb source dev,NocoBase CLI,modo de desenvolvimento,hot reload"
---

# nb source dev

Inicia o modo de desenvolvimento em um env de origem npm ou Git. Para o env Docker, use [`nb app logs`](../app/logs.md) para visualizar os logs em execução.

## Uso

```bash
nb source dev [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI no qual iniciar o modo de desenvolvimento; quando omitido, usa o env atual |
| `--db-sync` | boolean | Sincroniza o banco de dados antes de iniciar o modo de desenvolvimento |
| `--port`, `-p` | string | Porta do servidor de desenvolvimento |
| `--client`, `-c` | boolean | Inicia apenas o cliente |
| `--server`, `-s` | boolean | Inicia apenas o servidor |
| `--inspect`, `-i` | string | Porta de debug Node.js inspect do servidor |

## Exemplos

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Comandos relacionados

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
