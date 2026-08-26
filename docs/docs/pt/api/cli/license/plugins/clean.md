---
title: "nb license plugins clean"
description: "Referência do comando nb license plugins clean: remover plugins comerciais baixados para um env selecionado."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Remove os plugins comerciais baixados para o env selecionado sem alterar a ativação da licença.

## Uso

```bash
nb license plugins clean [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, o env atual é usado |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--dry-run` | boolean | Visualizar quais plugins seriam removidos sem apagar nada |
| `--verbose` | boolean | Mostrar logs detalhados por plugin |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
