---
title: "nb env list"
description: "Referência do comando nb env list: lista os envs configurados do NocoBase CLI."
keywords: "nb env list,NocoBase CLI,lista de ambientes,API Base URL"
---

# nb env list

Lista todos os envs configurados.

Este comando mostra apenas a configuração salva. Use [`nb env status`](./status.md) quando quiser verificar o status.

## Uso


nb env list

## Saída

A tabela de saída inclui o marcador do ambiente atual, nome, tipo, `API Base URL`, tipo de autenticação e versão de runtime.

- `Current` marca com `*` o env efetivamente ativo
- `API Base URL` mostra o endereço bruto da API salvo
- `Runtime` mostra as informações de versão de runtime em cache

## Exemplos


nb env list

## Comandos relacionados

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
