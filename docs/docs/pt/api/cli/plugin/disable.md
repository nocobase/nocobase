---
title: "nb plugin disable"
description: "Referência do comando nb plugin disable: desativa um ou mais plugins no env do NocoBase selecionado."
keywords: "nb plugin disable,NocoBase CLI,desativar plugin"
---

# nb plugin disable

Desativa um ou mais plugins no env selecionado.

## Uso

```bash
nb plugin disable <packages...> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<packages...>` | string[] | Nome do pacote do plugin, obrigatório, suporta múltiplos valores |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, usa o env atual |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |

## Exemplos

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
