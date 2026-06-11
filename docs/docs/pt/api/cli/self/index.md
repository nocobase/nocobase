---
title: "nb self"
description: "Referência do comando nb self: verifica ou atualiza o NocoBase CLI instalado."
keywords: "nb self,NocoBase CLI,auto-atualização,verificação de versão"
---

# nb self

Verifica ou atualiza o NocoBase CLI instalado.

## Uso

```bash
nb self <command>
```

## Subcomandos

| Comando | Descrição |
| --- | --- |
| [`nb self check`](./check.md) | Verifica a versão atual do CLI e o suporte a auto-atualização |
| [`nb self update`](./update.md) | Atualiza o NocoBase CLI instalado globalmente via npm |

## Exemplos

```bash
nb self check
nb self check --json
nb self update --yes
```

## Comandos relacionados

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
