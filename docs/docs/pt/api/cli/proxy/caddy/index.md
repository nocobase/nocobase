---
title: "nb proxy caddy"
description: "Referência do grupo de comandos nb proxy caddy: gerencie o driver do provider Caddy, a geração de configuração e o controle de runtime."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` é o ponto de entrada do grupo de comandos para o provider Caddy.

Se você já tem um domínio, quer colocar o HTTPS no ar rapidamente e não quer manter muitos detalhes de TLS por conta própria, este normalmente é o melhor ponto de partida. Esse grupo cuida de duas coisas:

- escolher como o Caddy será executado, isto é, `local` ou `docker`
- gerar, iniciar, recarregar e inspecionar o ponto de entrada do Caddy para envs gerenciados pela CLI

## Uso

```bash
nb proxy caddy <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Alterna o driver do Caddy |
| [`nb proxy caddy current`](./current.md) | Mostra o driver atual |
| [`nb proxy caddy generate`](./generate.md) | Gera ou atualiza a configuração do Caddy para um env |
| [`nb proxy caddy start`](./start.md) | Inicia o proxy Caddy |
| [`nb proxy caddy restart`](./restart.md) | Reinicia o proxy Caddy |
| [`nb proxy caddy reload`](./reload.md) | Recarrega a configuração do Caddy |
| [`nb proxy caddy stop`](./stop.md) | Para o proxy Caddy |
| [`nb proxy caddy status`](./status.md) | Mostra o status de runtime do Caddy |
| [`nb proxy caddy info`](./info.md) | Mostra o driver, os caminhos de configuração e as informações de runtime |

## Notas

- O driver atual é armazenado em `proxy.caddy-driver`
- O driver padrão é `local`
- O driver local usa o executável apontado por `bin.caddy`, cujo valor padrão é `caddy`
- O driver Docker usa `caddy:latest`
- O nome padrão do contêiner Docker é `<docker.container-prefix>-caddy-proxy`
- O driver Docker monta o `NB_CLI_ROOT` do host no contêiner em `/apps`

## Fluxo de trabalho típico

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Comandos relacionados

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
