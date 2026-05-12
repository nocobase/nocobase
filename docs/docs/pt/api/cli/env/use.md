---
title: "nb env use"
description: "Referência do comando nb env use: alterna o env atual do NocoBase CLI."
keywords: "nb env use,NocoBase CLI,alternar ambiente,current env"
---

# nb env use

Alterna o env atual do CLI. Depois disso, comandos sem `--env` passam a usar esse env por padrão.

Quando o session mode está habilitado para o shell ou runtime atual, essa mudança afeta apenas a sessão atual.

Quando o session mode não está habilitado, isso volta a atualizar o `last env` global. Nesse caso, outros terminais ou runtimes de agente sem isolamento de sessão também podem ser afetados.

## Uso

```bash
nb env use <name>
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<name>` | string | Nome do ambiente configurado para o qual alternar |

## Exemplos

```bash
nb env use local
```

## Comandos relacionados

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
