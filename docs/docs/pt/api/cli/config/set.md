---
title: "nb config set"
description: "Referência do comando nb config set: definir um valor de configuração do CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Define um valor de configuração do CLI. As chaves suportadas são `license.pkg-url`, `docker.network` e `docker.container-prefix`.

## Uso

```bash
nb config set <key> <value>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<key>` | string | Chave de configuração: `license.pkg-url`, `docker.network` ou `docker.container-prefix` |
| `<value>` | string | Valor de configuração; não pode ser vazio |

## Exemplos

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Observações

Ao definir `license.pkg-url`, o CLI normaliza a URL para que ela termine com `/`.

## Comandos relacionados

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
