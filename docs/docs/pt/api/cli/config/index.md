---
title: 'nb config'
description: 'Referência do comando nb config: gerencie os itens de configuração padrão do NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,configuração,configuração padrão'
---

# nb config

Gerencie a configuração padrão da CLI. Os itens de configuração atualmente suportados incluem:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Itens de configuração comuns

| Item de configuração | Valor padrão | Descrição |
| --- | --- | --- |
| `locale` | Resolvido de acordo com as regras atuais da CLI | Sobrescreve o idioma usado pela CLI |
| `update.policy` | `prompt` | Política de atualização na inicialização: `prompt`, `auto` ou `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Sobrescreve a URL de download dos pacotes de extensões comerciais |
| `docker.network` | `nocobase` | Rede padrão para aplicativos Docker gerenciados pela CLI |
| `docker.container-prefix` | `nb` | Prefixo padrão para contêineres Docker gerenciados pela CLI |
| `bin.docker` | `docker` | Sobrescreve o caminho do executável do Docker |
| `bin.caddy` | `caddy` | Sobrescreve o caminho do executável do Caddy |
| `bin.git` | `git` | Sobrescreve o caminho do executável do Git |
| `bin.nginx` | `nginx` | Sobrescreve o caminho do executável do Nginx |
| `bin.yarn` | `yarn` | Sobrescreve o caminho do executável do Yarn |
| `proxy.provider` | `nginx` | Provedor de proxy padrão usado por `nb env proxy` |
| `proxy.nb-cli-root` | Raiz da CLI, normalmente o diretório home do usuário atual | Mapeia o caminho `.nocobase` para a raiz visível ao processo do proxy |
| `proxy.upstream-host` | `127.0.0.1` | Host usado pelo proxy ao encaminhar o tráfego de volta para o aplicativo NocoBase |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb config get`](./get.md)       | Lê o valor efetivo de um item de configuração                  |
| [`nb config set`](./set.md)       | Define um item de configuração                                 |
| [`nb config delete`](./delete.md) | Exclui um item de configuração definido explicitamente         |
| [`nb config list`](./list.md)     | Lista os itens de configuração explicitamente definidos        |

## Exemplos

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
