---
title: "nb config delete"
description: "Referência do comando nb config delete: excluir uma configuração explícita do CLI."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Exclui uma configuração explícita do CLI. Depois disso, o CLI volta a usar o valor padrão dessa chave.

## Uso

```bash
nb config delete <key>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Chave de configuração: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemplos

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
