---
title: "nb app upgrade"
description: "Referência do comando nb app upgrade: atualiza o código-fonte ou a imagem e reinicia a aplicação NocoBase especificada."
keywords: "nb app upgrade,NocoBase CLI,upgrade,atualização,imagem Docker"
---

# nb app upgrade

Faz upgrade da aplicação NocoBase especificada. Instalações npm/Git atualizam o código-fonte salvo e reiniciam com quickstart; instalações Docker atualizam a imagem salva e recriam o contêiner da aplicação.

## Uso

```bash
nb app upgrade [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a passar por upgrade; usa o env atual quando omitido |
| `--skip-code-update`, `-s` | boolean | Reinicia usando o código-fonte local ou a imagem Docker já salva, sem baixar atualizações |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de atualização e reinício |

## Exemplos

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## Comandos relacionados

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
