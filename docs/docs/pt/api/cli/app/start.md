---
title: "nb app start"
description: "Referência do comando nb app start: inicia a aplicação NocoBase ou o contêiner Docker do env especificado."
keywords: "nb app start,NocoBase CLI,iniciar aplicação,Docker,pm2"
---

# nb app start

Inicia a aplicação NocoBase do env especificado. Instalações npm/Git executam os comandos da aplicação local; instalações Docker iniciam o contêiner da aplicação salvo.

## Uso

```bash
nb app start [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser iniciado; usa o env atual quando omitido |
| `--quickstart` | boolean | Inicia rapidamente a aplicação |
| `--port`, `-p` | string | Sobrescreve o `appPort` na configuração do env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Define se a aplicação será executada como daemon; habilitado por padrão |
| `--instances`, `-i` | integer | Número de instâncias a executar |
| `--launch-mode` | string | Modo de inicialização: `pm2` ou `node` |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes locais ou Docker |

## Exemplos

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local-docker
```

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
