---
title: "nb env status"
description: "Referência do comando nb env status: mostra o status do env atual, de um env ou de todos os envs."
keywords: "nb env status,NocoBase CLI,status do ambiente,API Base URL"
---

# nb env status

Mostra o status do env. Por padrão, ele inspeciona o env atual. Você também pode inspecionar um env específico, ou usar `--all` para todos os envs.

Este comando imprime uma tabela de status simplificada com `Env`, `Status` e `API Base URL`.

## Uso


nb env status [name] [flags]

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| [name] | string | Env name to inspect; uses the current env if omitted |
| --all | boolean | Show status for all configured envs |
| --json-output | boolean | Output the result as JSON |

`[name]` and `--all` cannot be used together.

## Status values

`Status` é o resultado retornado depois que a CLI verifica o env de destino. Valores comuns incluem:

- `ok`: o env está acessível e autenticado
- `auth failed`: a API está acessível, mas a autenticação falhou
- `unreachable`: não foi possível alcançar o endereço de destino
- `unconfigured`: a configuração do env está incompleta
- `missing`: o app gerenciado para esse env não existe mais

## Exemplos


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Comandos relacionados

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
