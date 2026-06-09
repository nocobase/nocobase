---
title: "Nginx"
description: "Use o nb proxy nginx para gerar e gerenciar a configuração de reverse proxy do Nginx para envs NocoBase gerenciados pela CLI."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,production"
---

# Nginx

Se você já usa Nginx no servidor para gerenciar sites, ou ainda quer continuar gerenciando certificados, cache e controle de acesso por conta própria, `nb proxy nginx` é o caminho recomendado.

## Ordem recomendada

Para um env gerenciado pela CLI do tipo `local` ou `docker`, a ordem padrão é:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Ou com um processo local:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Os comandos de acompanhamento mais comuns são:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

## Entradas necessárias para `generate`

A forma mais comum é:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Se você também quiser especificar a porta de entrada:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Onde:

- `--env`: qual env CLI deve receber a configuração
- `--host`: o nome de domínio público
- `--port`: a porta de entrada do proxy, não o `appPort` da própria aplicação

Se o env não tiver `appPort`, salve-o antes com `nb env update test2 --app-port 56575`.

## Arquivos mantidos pela CLI

Usando `test2` como exemplo, o fluxo do Nginx normalmente mantém:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

Uma entrada Nginx gerada de forma completa normalmente cobre estas áreas:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Isso significa que uma configuração real de produção do NocoBase normalmente é mais do que um único bloco simples de `proxy_pass`.

## Configuração manual

Se o app não for gerenciado pela CLI, ou se você quiser manter toda a configuração do Nginx manualmente de propósito, ainda pode escrevê-la à mão.

Mas no NocoBase, um reverse proxy pronto para produção normalmente precisa lidar não apenas com o proxy para o backend, mas também com uploads, assets do frontend, WebSocket, rotas `.well-known` e páginas de fallback SPA.

Quando o app usa implantação em subcaminho, ou quando assets, uploads e proxy não compartilham a mesma visão de caminho, a configuração manual fica mais propensa a erro. Nesses casos, normalmente é mais seguro gerar a configuração primeiro com:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

## Links relacionados

- [Reverse proxy em produção](./index.md)
- [Caddy](./caddy.md)
- [Instalar com a CLI](../../installation/cli.md)
