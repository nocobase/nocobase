---
title: 'nb config get'
description: 'Referência do comando nb config get: lê o valor efetivo de um item de configuração da CLI.'
keywords: 'nb config get,NocoBase CLI,ler configuração'
---

# nb config get

Lê o valor efetivo do item de configuração da CLI especificado. Se não tiver sido definido explicitamente, retorna o valor padrão.

## Uso

```bash
nb config get <key>
```

## Parâmetros

| Parâmetro | Tipo   | Descrição                                                                                                                                   |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nome do item de configuração: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemplos

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
