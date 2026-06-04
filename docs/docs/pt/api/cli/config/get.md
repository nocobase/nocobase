---
title: "nb config get"
description: "Referência do comando nb config get: obter o valor efetivo de uma chave de configuração do CLI."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Obtém o valor efetivo de uma chave de configuração do CLI. Se nenhum valor explícito estiver definido, o valor padrão será retornado.

## Uso

```bash
nb config get <key>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Chave de configuração: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemplos

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
