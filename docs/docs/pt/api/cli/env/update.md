---
title: "nb env update"
description: "Referência do comando nb env update: atualiza o OpenAPI Schema e o cache de comandos em tempo de execução do env especificado."
keywords: "nb env update,NocoBase CLI,OpenAPI,comandos em tempo de execução,swagger"
---

# nb env update

Atualiza o OpenAPI Schema a partir da aplicação NocoBase e atualiza o cache local de comandos em tempo de execução. O cache é armazenado em `.nocobase/versions/<hash>/commands.json`.

## Uso

```bash
nb env update [name] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do ambiente; quando omitido, usa o env atual |
| `--verbose` | boolean | Exibe o progresso detalhado |
| `--api-base-url` | string | Sobrescreve o endereço da API NocoBase e o persiste no env de destino |
| `--role` | string | Sobrescrita de role, enviada como cabeçalho `X-Role` |
| `--token`, `-t` | string | Sobrescrita de API key, persistida no env de destino |

## Exemplos

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Comandos relacionados

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
