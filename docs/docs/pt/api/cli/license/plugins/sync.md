---
title: "nb license plugins sync"
description: "Referência do comando nb license plugins sync: sincroniza os plugins comerciais permitidos pela licença atual para um env selecionado."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Sincroniza os plugins comerciais permitidos pela licença atual.

## Uso

```bash
nb license plugins sync [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; usa o env atual quando omitido |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--dry-run` | boolean | Visualizar mudanças sem instalar, atualizar ou remover plugins |
| `--version` | string | Versão do registry ou dist-tag a sincronizar; por padrão, usa a versão atual do workspace |
| `--skip-if-no-license` | boolean | Pula sem erro quando o env atual ainda não tem uma chave de licença salva |
| `--verbose` | boolean | Mostrar logs detalhados por plugin |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Observações

Quando `--version` é omitido, a CLI detecta automaticamente a versão atual da aplicação e a usa para decidir qual versão do registry dos plugins comerciais deve ser baixada.

`--skip-if-no-license` só ignora um caso: o env atual ainda não tem uma chave de licença salva. Outros erros, como credenciais de registry ausentes na chave, falhas de login no registry ou falhas no download dos plugins, continuam sendo mostrados normalmente.

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
