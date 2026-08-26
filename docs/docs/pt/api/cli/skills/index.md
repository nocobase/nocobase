---
title: "nb skills"
description: "Referência do comando nb skills: verifica, instala, atualiza ou remove os AI coding Skills globais do NocoBase."
keywords: "nb skills,NocoBase CLI,Skills,AI coding Skills"
---

# nb skills

Verifica, instala, atualiza ou remove os AI coding Skills globais do NocoBase.

## Uso

```bash
nb skills <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb skills check`](./check.md) | Verifica os AI coding Skills globais do NocoBase |
| [`nb skills install`](./install.md) | Instala globalmente os AI coding Skills do NocoBase |
| [`nb skills update`](./update.md) | Atualiza os AI coding Skills do NocoBase já instalados |
| [`nb skills remove`](./remove.md) | Remove os AI coding Skills do NocoBase gerenciados pelo `nb` |

## Exemplos

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
