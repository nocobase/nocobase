---
title: "nb env add"
description: "Referência do comando nb env add: salva o endereço da API e o método de autenticação do NocoBase e o define como env atual."
keywords: "nb env add,NocoBase CLI,adicionar ambiente,endereço da API,autenticação"
---

# nb env add

Salva um endpoint nomeado da API do NocoBase e faz o CLI passar a usar esse env. Quando o método de autenticação `oauth` é selecionado, o fluxo de login [`nb env auth`](./auth.md) é iniciado automaticamente.

## Uso

```bash
nb env add [name] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do ambiente; em TTY, ao omitir, será solicitado; em ambientes não-TTY é obrigatório |
| `--verbose` | boolean | Exibe progresso detalhado ao gravar a configuração |
| `--locale` | string | Idioma das mensagens do CLI: `en-US` ou `zh-CN` |
| `--api-base-url`, `-u` | string | Endereço da API do NocoBase, incluindo o prefixo `/api` |
| `--auth-type`, `-a` | string | Método de autenticação: `token` ou `oauth` |
| `--access-token`, `-t` | string | API key ou access token usado pelo método de autenticação `token` |

## Exemplos

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Comandos relacionados

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
