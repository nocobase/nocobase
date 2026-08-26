---
title: "nb skills"
description: "Referencia del comando nb skills: comprueba, instala, actualiza o elimina las Skills de AI coding globales de NocoBase."
keywords: "nb skills,NocoBase CLI,Skills,AI coding skills"
---

# nb skills

Comprueba, instala, actualiza o elimina las Skills de AI coding globales de NocoBase.

## Uso

```bash
nb skills <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb skills check`](./check.md) | Comprueba las Skills de AI coding globales de NocoBase |
| [`nb skills install`](./install.md) | Instala globalmente las Skills de AI coding de NocoBase |
| [`nb skills update`](./update.md) | Actualiza las Skills de AI coding de NocoBase ya instaladas |
| [`nb skills remove`](./remove.md) | Elimina las Skills de AI coding de NocoBase gestionadas por `nb` |

## Ejemplos

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
