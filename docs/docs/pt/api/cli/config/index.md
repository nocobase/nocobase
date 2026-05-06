---
title: "nb config"
description: "Referência do comando nb config: gerenciar a configuração padrão do CLI."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Gerencia a configuração padrão do CLI. Chaves atualmente suportadas:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb config get`](./get.md) | Obter o valor efetivo de uma chave de configuração |
| [`nb config set`](./set.md) | Definir um valor de configuração |
| [`nb config delete`](./delete.md) | Excluir um valor configurado explicitamente |
| [`nb config list`](./list.md) | Listar valores configurados explicitamente |

## Exemplos

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
