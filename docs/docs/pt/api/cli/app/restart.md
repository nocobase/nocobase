---
title: "nb app restart"
description: "Referência do comando nb app restart: reinicia a aplicação NocoBase ou o contêiner Docker do env especificado."
keywords: "nb app restart,NocoBase CLI,reiniciar aplicação,Docker"
---

# nb app restart

Para e em seguida inicia a aplicação NocoBase do env especificado.

## Uso

```bash
nb app restart [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser reiniciado; usa o env atual quando omitido |
| `--quickstart` | boolean | Inicia rapidamente a aplicação após a parada |
| `--port`, `-p` | string | Sobrescreve o `appPort` na configuração do env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Define se a aplicação será executada como daemon após a parada; habilitado por padrão |
| `--instances`, `-i` | integer | Número de instâncias a executar após a parada |
| `--launch-mode` | string | Modo de inicialização: `pm2` ou `node` |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de parada e inicialização |

## Exemplos

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
