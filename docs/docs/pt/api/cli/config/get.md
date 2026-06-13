---
title: "nb config get"
description: "Referência do comando nb config get: leia o valor efetivo de um item de configuração da CLI."
keywords: "nb config get,NocoBase CLI,ler configuração"
---

# nb config get

Lê o valor efetivo do item de configuração da CLI especificado. Se ele não tiver sido definido explicitamente, o valor padrão será retornado.

## Uso

```bash
nb config get <key>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Nome do item de configuração. Consulte [`nb config`](./index.md) para ver os valores suportados |

## Exemplos

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
