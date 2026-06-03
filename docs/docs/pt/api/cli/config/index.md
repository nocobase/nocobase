---
title: 'nb config'
description: 'Referência do comando nb config: gerencia os itens de configuração padrão do NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,configuração,configuração padrão'
---

# nb config

Gerencie a configuração padrão da CLI. Os itens de configuração atualmente suportados incluem:

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Itens de configuração comuns

| Item de configuração      | Valor padrão                                    | Descrição                                                           |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `locale`                  | Resolvido de acordo com as regras atuais da CLI | Sobrescreve o idioma usado pela CLI                                 |
| `update.policy`           | `prompt`                                        | Política de atualização na inicialização: `prompt`, `auto` ou `off` |
| `docker.network`          | `nocobase`                                      | Rede padrão para aplicativos Docker gerenciados pela CLI            |
| `docker.container-prefix` | `nb`                                            | Prefixo padrão para contêineres Docker gerenciados pela CLI         |
| `bin.docker`              | `docker`                                        | Sobrescreve o caminho do executável do Docker                       |
| `bin.git`                 | `git`                                           | Sobrescreve o caminho do executável do Git                          |
| `bin.yarn`                | `yarn`                                          | Sobrescreve o caminho do executável do Yarn                         |

## Uso

```bash
nb config <command>
```

## Subcomandos

| Comando                           | Descrição                                                          |
| --------------------------------- | ------------------------------------------------------------------ |
| [`nb config get`](./get.md)       | Lê o valor efetivo de um item de configuração                      |
| [`nb config set`](./set.md)       | Define um item de configuração                                     |
| [`nb config delete`](./delete.md) | Exclui um item configurado explicitamente                          |
| [`nb config list`](./list.md)     | Lista os itens de configuração atualmente definidos explicitamente |

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
