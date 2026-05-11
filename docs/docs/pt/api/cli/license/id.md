---
title: "nb license id"
description: "Referência do comando nb license id: exibir ou regenerar o ID de instância da licença comercial para um env selecionado."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Exibe o ID de instância da licença comercial para o env selecionado. Se ainda não existir um ID salvo, o CLI o gera e salva automaticamente.

## Uso

```bash
nb license id [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, o env atual é usado |
| `--force` | boolean | Regenerar o ID da instância mesmo que já exista um salvo |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license id
nb license id --env app1
nb license id --env app1 --force
nb license id --env app1 --json
```

## Comandos relacionados

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
