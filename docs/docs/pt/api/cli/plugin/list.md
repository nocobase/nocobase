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
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |

## Exemplos

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
