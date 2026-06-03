---
title: 'nb config set'
description: 'Referência do comando nb config set: define um item de configuração da CLI.'
keywords: 'nb config set,NocoBase CLI,definir configuração'
---

# nb config set

Define um item de configuração da CLI. Os itens de configuração atualmente suportados são `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` e `bin.yarn`.

## Uso

```bash
nb config set <key> <value>
```

## Parâmetros

| Parâmetro | Tipo   | Descrição                                                                                                                                   |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nome do item de configuração: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |
| `<value>` | string | Valor da configuração, não pode estar vazio                                                                                                 |

## Exemplos

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Observações

`update.policy` suporta `prompt`, `auto` e `off`, e o valor padrão é `prompt`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
