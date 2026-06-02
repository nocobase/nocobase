---
title: "nb app"
description: "Referência do comando nb app: gerencia o estado de execução da aplicação NocoBase, incluindo iniciar, parar, reiniciar, logs, limpeza e upgrade."
keywords: "nb app,NocoBase CLI,iniciar,parar,reiniciar,logs,upgrade"
---

# nb app

Gerencia o estado de execução da aplicação NocoBase. Envs npm/Git executam os comandos da aplicação no diretório de código-fonte local; envs Docker gerenciam os contêineres da aplicação com base na configuração de env salva.

## Uso

```bash
nb app <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb app start`](./start.md) | Inicia a aplicação ou recria o contêiner Docker |
| [`nb app stop`](./stop.md) | Para a aplicação ou remove o contêiner Docker |
| [`nb app restart`](./restart.md) | Para e em seguida inicia a aplicação |
| [`nb app logs`](./logs.md) | Visualiza os logs da aplicação |
| [`nb app down`](./down.md) | Para e limpa os recursos de execução locais |
| [`nb app destroy`](./destroy.md) | Remove os recursos de runtime gerenciados, os dados de storage e a configuração salva do env |
| [`nb app upgrade`](./upgrade.md) | Para a aplicação, substitui o código-fonte ou a imagem e a inicia novamente |

## Exemplos

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app down --env app1 --all --force
nb app destroy --env app1 --force
```

## Comandos relacionados

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
