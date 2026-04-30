---
title: "nb env list"
description: "Referência do comando nb env list: lista os env configurados do NocoBase CLI e o status de autenticação da API."
keywords: "nb env list,NocoBase CLI,lista de ambientes,status de autenticação"
---

# nb env list

Lista todos os env configurados e verifica o status de autenticação da API da aplicação utilizando as credenciais Token/OAuth já salvas.

## Uso

```bash
nb env list
```

## Saída

A tabela de saída inclui o marcador do ambiente atual, nome, tipo, App Status, URL, método de autenticação e versão em tempo de execução.

`App Status` representa o status retornado quando o CLI acessa a API da aplicação utilizando as informações de autenticação do env atual, por exemplo `ok`, `auth failed`, `unreachable` ou `unconfigured`. Para verificar o status de execução do banco de dados, use [`nb db ps`](../db/ps.md).

## Exemplos

```bash
nb env list
```

## Comandos relacionados

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
