---
title: "nb self check"
description: "Referência do comando nb self check: verifica a versão do NocoBase CLI instalado e o suporte a auto-atualização."
keywords: "nb self check,NocoBase CLI,verificação de versão"
---

# nb self check

Verifica a instalação atual do NocoBase CLI, resolve a versão mais recente do channel selecionado e informa se há suporte para auto-atualização automática.

## Uso

```bash
nb self check [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--channel` | string | Channel de release a ser comparado, padrão `auto`; opções: `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Saída em JSON |

## Exemplos

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Comandos relacionados

- [`nb self update`](./update.md)
