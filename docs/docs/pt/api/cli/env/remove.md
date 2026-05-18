---
title: "nb env remove"
description: "Referência do comando nb env remove: remove a configuração de um env específico do NocoBase CLI."
keywords: "nb env remove,NocoBase CLI,excluir ambiente,remover configuração"
---

# nb env remove

Remove um env já configurado. Este comando remove apenas a configuração salva do env do CLI e não limpa diretórios locais da aplicação, contêineres nem dados de storage; use [`nb app down`](../app/down.md) quando precisar limpar recursos locais de runtime.

Se o env removido também for o env atual, a CLI seleciona automaticamente um novo env atual a partir dos envs restantes. Se não restar nenhum env, o env atual será limpo.

Por padrão, o comando solicita confirmação. Para ignorá-la, passe `--yes`. No modo não interativo, `--yes` é obrigatório antes que o env possa ser removido.

## Uso

```bash
nb env remove <name> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<name>` | string | Nome do ambiente configurado a ser removido |
| `--yes`, `-y` | boolean | Pula a confirmação e remove a configuração salva do env do CLI |
| `--verbose` | boolean | Exibe o progresso detalhado |

## Exemplos

```bash
nb env remove staging
nb env remove staging --yes
```

## Comandos relacionados

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
