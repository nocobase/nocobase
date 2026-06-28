---
title: "nb config set"
description: "Referência do comando nb config set: defina um item de configuração da CLI."
keywords: "nb config set,NocoBase CLI,definir configuração"
---

# nb config set

Define um item de configuração da CLI. Consulte [`nb config`](./index.md) para ver as chaves de configuração suportadas.

## Uso

```bash
nb config set <key> <value>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Nome do item de configuração. Consulte [`nb config`](./index.md) para ver os valores suportados |
| `<value>` | string | Valor de configuração; não pode estar vazio |

## Exemplos

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## Notas

`update.policy` aceita `prompt`, `auto` e `off`, e o valor padrão é `prompt`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
