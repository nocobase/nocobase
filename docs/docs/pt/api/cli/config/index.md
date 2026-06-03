---
title: "nb config"
description: "Referência do comando nb config: gerenciar os itens de configuração padrão do CLI do NocoBase."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Gerencia a configuração padrão do CLI. Chaves atualmente suportadas:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Chaves comuns

| Chave | Valor padrão | Descrição |
| --- | --- | --- |
| `locale` | resolução atual de locale do CLI | Sobrescreve o idioma usado pelo CLI |
| `update.policy` | `prompt` | Comportamento de atualização na inicialização: `prompt`, `auto` ou `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Registro de pacotes usado para pacotes comerciais |
| `docker.network` | `nocobase` | Rede Docker padrão usada por apps Docker gerenciados pelo CLI |
| `docker.container-prefix` | `nb` | Prefixo padrão de contêiner usado por apps Docker gerenciados pelo CLI |
| `bin.docker` | `docker` | Sobrescreve o caminho do executável do Docker |
| `bin.git` | `git` | Sobrescreve o caminho do executável do Git |
| `bin.yarn` | `yarn` | Sobrescreve o caminho do executável do Yarn |

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
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
