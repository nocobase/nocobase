---
title: "nb self update"
description: "Referência do comando nb self update: atualiza o NocoBase CLI instalado globalmente via npm."
keywords: "nb self update,NocoBase CLI,atualizar,auto-atualização"
---

# nb self update

Atualiza o NocoBase CLI instalado quando o CLI atual é gerenciado pela instalação global padrão do npm.

## Uso

```bash
nb self update [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--channel` | string | Channel de release para o qual atualizar, padrão `auto`; opções: `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Pula a confirmação de atualização |
| `--json` | boolean | Saída em JSON |
| `--verbose` | boolean | Exibe a saída detalhada da atualização |

## Exemplos

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Comandos relacionados

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
