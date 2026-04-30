---
title: "nb plugin enable"
description: "Referência do comando nb plugin enable: ativa um ou mais plugins no env do NocoBase selecionado."
keywords: "nb plugin enable,NocoBase CLI,ativar plugin"
---

# nb plugin enable

Ativa um ou mais plugins no env selecionado.

## Uso

```bash
nb plugin enable <packages...> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<packages...>` | string[] | Nome do pacote do plugin, obrigatório, suporta múltiplos valores |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, usa o env atual |

## Exemplos

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## Comandos relacionados

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
