---
title: "Caddy"
description: "Use o nb proxy caddy para gerar e gerenciar a configuração de reverse proxy do Caddy para envs NocoBase gerenciados pela CLI."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,production"
---

# Caddy

Se você já tem um domínio e quer colocar o HTTPS no ar rapidamente, `nb proxy caddy` costuma ser o caminho de entrada mais simples.

## Ordem recomendada

Para um env gerenciado pela CLI do tipo `local` ou `docker`, a ordem padrão é:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Ou com um processo local:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Os comandos de acompanhamento mais comuns são:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

## Entradas necessárias para `generate`

A forma mais comum é:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Se você também quiser especificar a porta de entrada:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Onde:

- `--env`: qual env CLI deve receber a configuração
- `--host`: o nome de domínio público
- `--port`: a porta de entrada do proxy

No Caddy, `--host` é especialmente importante, porque o endereço do site influencia diretamente o fluxo de HTTPS.

## Arquivos mantidos pela CLI

Usando `test2` como exemplo, o fluxo do Caddy normalmente mantém:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

Onde:

- `nocobase.caddy` é o arquivo de entrada em nível de provider que importa todos os arquivos `app.caddy` dos envs
- `app.caddy` é a configuração completa do site para um env e é sobrescrito por completo quando você o regenera

## Configuração manual

Se o app não for gerenciado pela CLI, ou se você quiser manter toda a configuração do Caddy manualmente de propósito, ainda pode escrevê-la à mão.

Mas no NocoBase, uma entrada do Caddy pronta para produção normalmente precisa lidar com mais do que uma única linha simples de `reverse_proxy`. Em geral, ela também inclui uploads, assets do frontend, rotas `.well-known`, WebSocket e páginas de fallback SPA.

Quando o app usa implantação em subcaminho, ou quando assets, uploads e camada de entrada não compartilham a mesma visão de caminho, a configuração manual fica mais propensa a erro. Nesses casos, normalmente é mais seguro gerar a configuração primeiro com:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

## Links relacionados

- [Reverse proxy em produção](./index.md)
- [Nginx](./nginx.md)
- [Instalar com a CLI](../../installation/cli.md)
