---
title: "nb config delete"
description: "Referência do comando nb config delete: exclua um item de configuração da CLI definido explicitamente."
keywords: "nb config delete,NocoBase CLI,excluir configuração"
---

# nb config delete

Exclui um item de configuração da CLI que tenha sido definido explicitamente. Após a exclusão, esse item volta ao valor padrão.

## Uso

```bash
nb config delete <key>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Nome do item de configuração. Consulte [`nb config`](./index.md) para ver os valores suportados |

## Exemplos

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Comandos relacionados

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
