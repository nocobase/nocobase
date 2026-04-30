---
title: "nb env auth"
description: "Referência do comando nb env auth: realiza login OAuth em um env do NocoBase já salvo."
keywords: "nb env auth,NocoBase CLI,OAuth,login,autenticação"
---

# nb env auth

Realiza login OAuth no env especificado. Quando o nome do ambiente é omitido, usa o env atual.

## Uso

```bash
nb env auth [name]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do ambiente; usa o env atual quando omitido |

## Descrição

Internamente utiliza o fluxo PKCE: inicia um serviço de callback local, abre o navegador para a autorização, troca o token e o salva no arquivo de configuração.

## Exemplos

```bash
nb env auth
nb env auth prod
```

## Comandos relacionados

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
