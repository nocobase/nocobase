---
title: "nb app"
description: "Referência do comando nb app: gerencia o estado de execução da aplicação NocoBase, incluindo iniciar, parar, reiniciar, logs, limpeza e upgrade."
keywords: "nb app,NocoBase CLI,iniciar,parar,reiniciar,logs,upgrade"
---

# nb app

Gerencia o estado de execução da aplicação NocoBase. Envs npm/Git executam os comandos da aplicação no diretório de código-fonte local; envs Docker gerenciam o contêiner da aplicação salvo.

## Uso

```bash
nb app <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb app start`](./start.md) | Inicia a aplicação ou o contêiner Docker |
| [`nb app stop`](./stop.md) | Para a aplicação ou o contêiner Docker |
| [`nb app restart`](./restart.md) | Para e em seguida inicia a aplicação |
| [`nb app logs`](./logs.md) | Visualiza os logs da aplicação |
| [`nb app down`](./down.md) | Para e limpa os recursos de execução locais |
| [`nb app upgrade`](./upgrade.md) | Atualiza o código-fonte ou a imagem e reinicia a aplicação |

## Exemplos

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 -s
nb app down --env app1 --all --yes
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
