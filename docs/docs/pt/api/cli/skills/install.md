---
title: "nb skills install"
description: "Referência do comando nb skills install: instala globalmente os AI coding Skills do NocoBase."
keywords: "nb skills install,NocoBase CLI,instalar Skills"
---

# nb skills install

Instala globalmente os AI coding Skills do NocoBase. Caso já estejam instalados, este comando não executa atualização.

## Uso

```bash
nb skills install [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Pula a confirmação de instalação |
| `--json` | boolean | Saída em JSON |
| `--verbose` | boolean | Exibe a saída detalhada da instalação |

## Exemplos

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Comandos relacionados

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
