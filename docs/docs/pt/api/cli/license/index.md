---
title: "nb license"
description: "Referência do comando nb license: gerenciar o licenciamento comercial e os plugins licenciados do NocoBase."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Gerencia o licenciamento comercial do NocoBase, incluindo a ativação com uma license key existente, Instance IDs, status da licença e plugins licenciados.

## Uso

```bash
nb license <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb license activate`](./activate.md) | Ativar o licenciamento comercial do env atual com uma license key existente |
| [`nb license id`](./id.md) | Exibir ou gerar o ID da instância para o env atual |
| [`nb license status`](./status.md) | Exibir o status da licença comercial do env atual |
| [`nb license plugins`](./plugins/index.md) | Gerenciar plugins comerciais permitidos pela licença atual |

## Exemplos

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Comandos relacionados

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
