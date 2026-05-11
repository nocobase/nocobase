---
title: "nb license plugins list"
description: "Referência do comando nb license plugins list: exibir plugins comerciais associados à licença atual para um env selecionado."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Exibe os plugins comerciais associados ao license key salvo para o env selecionado.

## Uso

```bash
nb license plugins list [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, o env atual é usado |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --json
```

## Comandos relacionados

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
