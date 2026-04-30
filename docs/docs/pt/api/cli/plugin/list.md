---
title: "nb plugin list"
description: "Referência do comando nb plugin list: lista os plugins do env do NocoBase selecionado."
keywords: "nb plugin list,NocoBase CLI,lista de plugins"
---

# nb plugin list

Lista os plugins instalados do env selecionado.

## Uso

```bash
nb plugin list [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, usa o env atual |

## Exemplos

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Comandos relacionados

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
