---
title: "nb proxy nginx generate"
description: "Referência do comando nb proxy nginx generate: gere ou atualize a configuração do Nginx para um env gerenciado pela CLI."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

Gera ou atualiza a configuração de entrada do Nginx para um env gerenciado pela CLI.

## Uso

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env gerenciado pela CLI para o qual a configuração será gerada |
| `--host` | string | Host gravado na configuração de entrada, como `app1.example.com` |
| `--port` | string | Porta de escuta gravada na configuração de entrada, como `8080` |

## Arquivos gerados

Usando o env `test2` como exemplo, o comando normalmente mantém estes arquivos e diretórios:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

A entrada gerada do Nginx cobre principalmente estas áreas de capacidade:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Exemplos

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Notas

- `generate` apenas grava ou atualiza a configuração e não inicia o Nginx automaticamente
- `app.conf` é o arquivo de entrada editável, mas o bloco gerenciado deve permanecer intacto
- Se você alterar configurações como `app-port` ou `app-public-path` com `nb env update`, normalmente precisará executar este comando novamente
- Apenas envs `local` ou `docker` gerenciados pela CLI podem usar este comando

## Comandos relacionados

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
