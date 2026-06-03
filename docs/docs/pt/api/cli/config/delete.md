---
title: 'nb config delete'
description: 'Referência do comando nb config delete: exclui um item de configuração da CLI definido explicitamente.'
keywords: 'nb config delete,NocoBase CLI,excluir configuração'
---

# nb config delete

Exclui um item de configuração da CLI definido explicitamente. Após a exclusão, esse item de configuração volta ao valor padrão.

## Uso

```bash
nb config delete <key>
```

## Parâmetros

| Parâmetro | Tipo   | Descrição                                                                                                                                   |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `<key>`   | string | Nome do item de configuração: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` ou `bin.yarn` |

## Exemplos

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
