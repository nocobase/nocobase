---
title: 'nb env proxy'
description: 'Referência do comando nb env proxy: gera uma configuração de proxy Nginx ou Caddy para um env gerenciado pela CLI.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuração de proxy'
---

# nb env proxy

No NocoBase CLI, `nb env proxy` gera uma configuração de proxy reverso para um env gerenciado pela CLI. Na maioria dos casos, `nginx` é a escolha padrão. Troque para `caddy` apenas se você já usa Caddy ou se realmente precisa de um Caddyfile.

Esse comando funciona apenas para envs gerenciados cujo runtime pode ser alcançado a partir da máquina atual, ou seja, `local` ou `docker`. No momento, ele não oferece suporte a envs que tenham apenas conexão de API remota nem a envs SSH.

## Uso

```bash
nb env proxy [name] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do env configurado para o qual a configuração de proxy será gerada. Se omitido, usa o env atual |
| `--output`, `-o` | string | Caminho do arquivo de saída. O padrão é `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Provedor de proxy: `nginx` ou `caddy` |
| `--host` | string | Host gravado na configuração de entrada, como `example.com` ou `localhost` |
| `--port` | string | Porta gravada na configuração de entrada. Esta é a porta de entrada do proxy, não a porta do aplicativo NocoBase upstream |
| `--install` | boolean | Instala a configuração de proxy compartilhada na configuração principal do provedor |
| `--reload` | boolean | Valida e recarrega o provedor depois de gravar a configuração |
| `--print` | boolean | Imprime a configuração gerada em stdout em vez de gravar arquivos |

## Arquivos de saída padrão

Se você não passar `--output`, a CLI mantém três tipos de arquivos em `~/.nocobase/proxy/<provider>/`:

| Provedor | Arquivo generated | Arquivo de entrada editável | Configuração principal compartilhada |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Na prática:

- `generated.*` é gerenciado pela CLI e será sobrescrito na próxima vez que você executar `nb env proxy`
- `app.conf` / `app.caddy` é o arquivo de entrada que pode ser editado, mas a referência para a configuração generated mantida pela CLI deve permanecer
- `nocobase.conf` / `nocobase.caddy` é a configuração principal compartilhada que inclui os arquivos de entrada de todos os envs

Se você passar `--output`, a CLI grava apenas a configuração generated nesse arquivo e não cria nem atualiza o arquivo de entrada ou a configuração principal compartilhada.

## Itens de configuração relacionados

| Item de configuração | Valor padrão | Descrição |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Provedor padrão usado por `nb env proxy` |
| `proxy.nb-cli-root` | Raiz da CLI, normalmente o diretório home do usuário atual | Mapeia o caminho `.nocobase` para a raiz visível ao processo do proxy |
| `proxy.upstream-host` | `127.0.0.1` | Host usado pelo proxy ao encaminhar o tráfego de volta para o aplicativo NocoBase |
| `bin.caddy` | `caddy` | Caminho do executável do Caddy usado por `--install` ou `--reload` |
| `bin.nginx` | `nginx` | Caminho do executável do Nginx usado por `--install` ou `--reload` |

Na maioria dos ambientes, não é preciso alterar `proxy.nb-cli-root`. Normalmente isso só é necessário quando o Nginx ou o Caddy roda em outro contêiner, outra raiz de montagem ou outra visão de caminhos.

## Observações

- `--port` deve ser um número inteiro entre `1` e `65535`
- A porta do aplicativo NocoBase upstream vem do `appPort` salvo no env, não de `--port`
- Se o comando disser que o env não tem `appPort`, execute primeiro `nb env update <name>` ou salve esse valor explicitamente com `nb env update <name> --app-port <port>`
- `--print` não pode ser combinado com `--install` nem com `--reload`
- `--output` não pode ser combinado com `--install` nem com `--reload`
- `--install` conecta a configuração compartilhada à configuração principal do provedor. `--reload` valida e recarrega o provedor. Na prática, esses dois flags costumam ser usados juntos

## Exemplos

```bash
# Gera a configuração nginx padrão para o env atual
nb env proxy

# Gera uma configuração para um env específico
nb env proxy demo

# Imprime a configuração generated sem gravar arquivos
nb env proxy demo --print

# Grava host e porta na configuração de entrada
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Gera uma configuração Caddy
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Altera o provedor padrão e o host upstream
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Mapeia o caminho .nocobase quando o provedor roda sob outra raiz
nb config set proxy.nb-cli-root /workspace

# Instala a configuração compartilhada na configuração principal do provedor e recarrega o provedor
nb env proxy demo --install --reload
```

## Comandos relacionados

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
