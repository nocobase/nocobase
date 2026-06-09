---
title: "Reverse proxy em produção"
description: "Use nb proxy nginx e nb proxy caddy para gerar e gerenciar a configuração de reverse proxy para envs NocoBase gerenciados pela CLI."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,produção"
---

# Reverse proxy em produção

Na NocoBase CLI, os pontos de entrada recomendados para reverse proxy em produção são:

- `nb proxy nginx`
- `nb proxy caddy`

Onde:

- `proxy` gerencia a camada de entrada
- `nginx` e `caddy` são as implementações de provider
- `docker` e `local` são os drivers de runtime
- `--env <name>` seleciona para qual env CLI a configuração será gerada

Desde que seu app já tenha sido salvo como um env gerenciado pela CLI e esse env seja `local` ou `docker`, normalmente basta deixar a CLI gerar e gerenciar a configuração de reverse proxy. Assim, WebSocket, subcaminhos, páginas de fallback SPA e atualizações posteriores ficam alinhados no mesmo lugar.

Se o app não for gerenciado pela CLI, ou se você quiser manter toda a configuração manualmente, vá para as seções de configuração manual nas páginas de cada provider.

## Antes de começar

Verifique se:

- o app já pode ser acessado internamente, por exemplo em `http://127.0.0.1:13000`
- o app já foi salvo como um env CLI, e esse env é `local` ou `docker`
- o env já tem `appPort` salvo

Se o comando informar que falta `appPort`, atualize antes com [`nb env update`](../../../api/cli/env/update.md).

Se depois você alterar configurações como `app-port` ou `app-public-path` que afetam o comportamento do proxy, execute novamente o comando `generate` correspondente.

## Fluxo padrão

Para Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Para Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Os papéis são:

- `use docker|local`: escolher o driver de runtime do provider atual
- `generate --env <name> --host <domain>`: gerar a configuração de reverse proxy para um env
- `start`: iniciar o processo local ou o contêiner Docker do provider atual

## O que a CLI mantém

A CLI faz mais do que gerar um fragmento de proxy. Ela também mantém os arquivos auxiliares e a estrutura de entrada do site alinhados com o provider:

- O Nginx mantém `snippets` compartilhados, `app.conf`, `public/index-v1.html` e `public/index-v2.html`
- O Caddy mantém `nocobase.caddy`, `app.caddy`, `public/index-v1.html` e `public/index-v2.html`, em que `app.caddy` é a configuração completa do site para um env

## Qual página abrir primeiro

| Quero... | Ir para |
| --- | --- |
| Continuar usando Nginx para sites, certificados, cache ou controle de acesso | [Nginx](./nginx.md) |
| Colocar o HTTPS no ar rapidamente com menos detalhes de TLS para manter | [Caddy](./caddy.md) |
| Ajustar configurações do env que podem afetar o comportamento do proxy, como `app-port` ou `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Instalar primeiro o app como um env gerenciado pela CLI | [Instalar com a CLI](../../installation/cli.md) |
