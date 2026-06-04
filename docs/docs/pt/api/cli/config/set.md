---
title: "nb config set"
description: "Referência do comando nb config set: definir um valor de configuração do CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Define um valor de configuração do CLI. As chaves suportadas são `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` e `bin.yarn`.

## Uso

```bash
nb config set <key> <value>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Chave de configuração: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |
| `<value>` | string | Valor de configuração; não pode ser vazio |

## Exemplos

```bash
nb config set locale pt-BR
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Observações

Ao definir `license.pkg-url`, o CLI normaliza a URL para que ela termine com `/`.

`update.policy` aceita `prompt`, `auto` e `off`. O valor padrão é `prompt`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
