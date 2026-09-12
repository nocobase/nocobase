---
title: "nb self update"
description: "Referência do comando nb self update: atualiza o NocoBase CLI instalado globalmente via npm, pnpm ou yarn."
keywords: "nb self update,NocoBase CLI,atualizar,auto-atualização"
---

# nb self update

Atualiza o NocoBase CLI instalado quando o CLI atual é gerenciado por uma instalação global padrão de npm, pnpm ou yarn.

## Uso

```bash
nb self update [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--channel` | string | Channel de release para o qual atualizar, padrão `auto`; opções: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Pula a confirmação de atualização |
| `--json` | boolean | Saída em JSON |
| `--skills` | boolean | Também atualiza as NocoBase AI coding skills instaladas globalmente |
| `--verbose` | boolean | Exibe a saída detalhada da atualização |

## Comportamento da atualização

`nb self update` primeiro detecta o método de instalação atual em runtime. Ele não usa o cache histórico `self-install-methods.json`.

Quando há uma atualização disponível, o comando usa o mesmo package manager que gerencia a instalação global atual da CLI:

| Método de instalação | Comando de atualização |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

A confirmação interativa usa yes como padrão. Use `--yes` para pular o prompt em scripts.

## Exemplos

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Comandos relacionados

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
