---
title: "nb config"
description: "Referência do nb config: gerencie os valores de configuração padrão da CLI do NocoBase."
keywords: "nb config,NocoBase CLI,configuração,configuração padrão"
---

# nb config

Gerencia os valores de configuração padrão da CLI. As chaves atualmente suportadas se agrupam principalmente assim:

- A própria CLI: `locale`, `update.policy`, `license.pkg-url`
- Runtime do Docker: `docker.network`, `docker.container-prefix`
- Executáveis externos: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.pnpm`, `bin.yarn`
- Geração de proxy: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

A maioria dos projetos só precisa de algumas dessas chaves. Na prática, as mais comuns são:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` ou `bin.caddy`
- `proxy.nginx-driver` ou `proxy.caddy-driver`

## Chaves de configuração comuns

| Chave | Padrão | Descrição |
| --- | --- | --- |
| `locale` | resolvida pelas regras atuais da CLI | Sobrescreve o idioma usado pela CLI |
| `update.policy` | `prompt` | Política de atualização na inicialização: `prompt`, `auto` ou `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Sobrescreve a URL de download dos pacotes de extensões comerciais |
| `docker.network` | `nocobase` | Rede padrão para apps Docker gerenciados pela CLI |
| `docker.container-prefix` | `nb` | Prefixo padrão para containers Docker gerenciados pela CLI |
| `bin.docker` | `docker` | Sobrescreve o caminho do executável do Docker |
| `bin.caddy` | `caddy` | Sobrescreve o caminho do executável do Caddy |
| `bin.git` | `git` | Sobrescreve o caminho do executável do Git |
| `bin.nginx` | `nginx` | Sobrescreve o caminho do executável do Nginx |
| `bin.pnpm` | `pnpm` | Sobrescreve o caminho do executável do pnpm |
| `bin.yarn` | `yarn` | Sobrescreve o caminho do executável do Yarn |
| `proxy.nb-cli-root` | raiz da CLI, normalmente o diretório home do usuário atual | Sobrescreve o caminho raiz visível para a configuração de proxy gerada quando o processo do proxy e a CLI não enxergam a mesma raiz do sistema de arquivos |
| `proxy.upstream-host` | `127.0.0.1` | Sobrescreve o host usado pelo proxy para encaminhar tráfego de volta para a aplicação NocoBase |
| `proxy.nginx-driver` | `local` | Driver de runtime padrão usado por `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Driver de runtime padrão usado por `nb proxy caddy` |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb config get`](./get.md) | Lê o valor efetivo de uma chave de configuração |
| [`nb config set`](./set.md) | Define uma chave de configuração |
| [`nb config delete`](./delete.md) | Remove uma chave de configuração definida explicitamente |
| [`nb config list`](./list.md) | Lista as chaves de configuração atualmente definidas explicitamente |

## Exemplos

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config set bin.pnpm /usr/local/bin/pnpm
nb config delete docker.container-prefix
```

## Notas

- `bin.nginx` e `bin.caddy` afetam apenas o driver `local` de `nb proxy nginx` e `nb proxy caddy`
- `bin.pnpm` é usado quando comandos precisam executar pnpm diretamente, por exemplo ao atualizar uma instalação global da CLI gerenciada por pnpm com `nb self update`
- `proxy.nginx-driver` e `proxy.caddy-driver` armazenam o driver padrão usado por cada provider
- `proxy.nb-cli-root` e `proxy.upstream-host` são overrides avançados de proxy. Para a maioria dos envs `local` ou `docker` gerenciados pela CLI, os valores padrão já são suficientes
- Se você só quer trocar o driver ativo do proxy, normalmente é mais claro usar `nb proxy nginx use` ou `nb proxy caddy use` do que definir a chave manualmente

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
