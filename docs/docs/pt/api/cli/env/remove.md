---
title: "nb env remove"
description: "Referência do comando nb env remove: remove a configuração de um env específico do NocoBase CLI."
keywords: "nb env remove,NocoBase CLI,excluir ambiente,remover configuração"
---

# nb env remove

Remove um env já configurado. Este comando exclui apenas a configuração do env do CLI; quando for necessário limpar a aplicação local, contêineres e storage, use [`nb app down`](../app/down.md).

Se o env removido também for o env atual, a CLI seleciona automaticamente um novo env atual a partir dos envs restantes. Se não restar nenhum env, o env atual será limpo.

## Uso

```bash
nb env remove <name> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<name>` | string | Nome do ambiente a ser removido |
| `--force`, `-f` | boolean | Pula a confirmação e exclui diretamente |
| `--verbose` | boolean | Exibe o progresso detalhado |

## Exemplos

```bash
nb env remove staging
nb env remove staging -f
```

## Comandos relacionados

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
