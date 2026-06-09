---
title: "nb proxy nginx"
description: "Referência do grupo de comandos nb proxy nginx: gerencie o driver do provider Nginx, a geração de configuração e o controle de runtime."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` é o ponto de entrada do grupo de comandos para o provider Nginx.

Se você já usa o Nginx para gerenciar sites, certificados, cache ou controle de acesso, este normalmente é o melhor ponto de partida. Esse grupo cuida de duas coisas:

- escolher como o Nginx será executado, isto é, `local` ou `docker`
- gerar, iniciar, recarregar e inspecionar o ponto de entrada do Nginx para envs gerenciados pela CLI

## Uso

```bash
nb proxy nginx <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Alterna o driver do Nginx |
| [`nb proxy nginx current`](./current.md) | Mostra o driver atual |
| [`nb proxy nginx generate`](./generate.md) | Gera ou atualiza a configuração do Nginx para um env |
| [`nb proxy nginx start`](./start.md) | Inicia o proxy Nginx |
| [`nb proxy nginx restart`](./restart.md) | Reinicia o proxy Nginx |
| [`nb proxy nginx reload`](./reload.md) | Recarrega a configuração do Nginx |
| [`nb proxy nginx stop`](./stop.md) | Para o proxy Nginx |
| [`nb proxy nginx status`](./status.md) | Mostra o status de runtime do Nginx |
| [`nb proxy nginx info`](./info.md) | Mostra o driver, os caminhos de configuração e as informações de runtime |

## Notas

- O driver atual é armazenado em `proxy.nginx-driver`
- O driver padrão é `local`
- O driver local usa o executável apontado por `bin.nginx`, cujo valor padrão é `nginx`
- O driver Docker usa `nginx:latest`
- O nome padrão do contêiner Docker é `<docker.container-prefix>-nginx-proxy`
- O driver Docker monta o `NB_CLI_ROOT` do host no contêiner em `/apps`

## Fluxo de trabalho típico

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Comandos relacionados

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
