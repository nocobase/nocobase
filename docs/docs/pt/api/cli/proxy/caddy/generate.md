---
title: "nb proxy caddy generate"
description: "Referência do comando nb proxy caddy generate: gere ou atualize a configuração do Caddy para um env gerenciado pela CLI."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

Gera ou atualiza a configuração de entrada do Caddy para um env gerenciado pela CLI.

## Uso

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env gerenciado pela CLI para o qual a configuração será gerada |
| `--host` | string | Host gravado no endereço do site, como `app1.example.com` |
| `--port` | string | Porta de escuta gravada no endereço do site, como `8080` |

## Arquivos gerados

Usando o env `test2` como exemplo, o comando normalmente mantém estes arquivos e diretórios:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

No design atual, `app.caddy` já é a configuração completa do site para um env e não é mais dividido em um arquivo `generated.caddy` separado.

## Exemplos

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Notas

- `generate` apenas grava ou atualiza a configuração e não inicia o Caddy automaticamente
- Regenerar a configuração sobrescreve `app.caddy` como um todo
- Se você alterar configurações como `app-port` ou `app-public-path` com `nb env update`, normalmente precisará executar este comando novamente
- Apenas envs `local` ou `docker` gerenciados pela CLI podem usar este comando

## Comandos relacionados

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
