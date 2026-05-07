---
title: "nb app down"
description: "Referência do comando nb app down: para e limpa os recursos de execução locais do env especificado."
keywords: "nb app down,NocoBase CLI,limpeza de recursos,remover contêiner,storage"
---

# nb app down

Para e limpa os recursos de execução locais do env especificado. Por padrão, os dados de storage e a configuração do env são preservados; para remover todo o conteúdo, é obrigatório passar explicitamente `--all --yes`.

## Uso

```bash
nb app down [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser limpo; usa o env atual quando omitido |
| `--all` | boolean | Remove todo o conteúdo desse env, incluindo dados de storage e a configuração de env salva |
| `--yes`, `-y` | boolean | Pula a confirmação de operações destrutivas; geralmente usado junto com `--all` |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de parada e limpeza |

## Exemplos

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
