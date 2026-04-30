---
title: "nb skills update"
description: "Referência do comando nb skills update: atualiza os AI coding Skills globais do NocoBase."
keywords: "nb skills update,NocoBase CLI,atualizar Skills"
---

# nb skills update

Atualiza os AI coding Skills do NocoBase instalados globalmente. Este comando atualiza apenas instalações existentes de `@nocobase/skills`.

## Uso

```bash
nb skills update [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Pula a confirmação de atualização |
| `--json` | boolean | Saída em JSON |
| `--verbose` | boolean | Exibe a saída detalhada da atualização |

## Exemplos

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Comandos relacionados

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
