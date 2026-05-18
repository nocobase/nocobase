---
title: "nb app down"
description: "Referência do comando nb app down: para e limpa os recursos de execução locais do env especificado."
keywords: "nb app down,NocoBase CLI,limpeza de recursos,remover contêiner,storage"
---

# nb app down

Para e limpa os recursos de execução locais do env especificado. Por padrão, os dados de storage e a configuração do env são preservados; para remover todo o conteúdo, é obrigatório passar explicitamente `--all --force`.

## Uso

```bash
nb app down [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser limpo; usa o env atual quando omitido |
| `--all` | boolean | Remove todo o conteúdo desse env, incluindo dados de storage e a configuração de env salva |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--force`, `-f` | boolean | Força uma limpeza destrutiva, como `--all` ou outras limpezas de alto risco em modo não interativo |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de parada e limpeza |

## Exemplos

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` apenas ignora a confirmação interativa quando um `--env` passado explicitamente aponta para uma env diferente da env atual. `--force` serve para realmente forçar uma limpeza destrutiva, como `--all` ou outras limpezas de alto risco em modo não interativo.

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
