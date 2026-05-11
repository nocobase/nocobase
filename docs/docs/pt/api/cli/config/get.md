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
| `<key>` | string | Chave de configuração: `license.pkg-url`, `docker.network` ou `docker.container-prefix` |

## Exemplos

```bash
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
