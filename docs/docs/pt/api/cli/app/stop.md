---
title: "nb app stop"
description: "Referência do comando nb app stop: para a aplicação NocoBase ou o contêiner Docker do env especificado."
keywords: "nb app stop,NocoBase CLI,parar aplicação,Docker"
---

# nb app stop

Para a aplicação NocoBase do env especificado. Instalações npm/Git param o processo da aplicação local; instalações Docker param o contêiner da aplicação salvo.

## Uso

```bash
nb app stop [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser parado; usa o env atual quando omitido |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes locais ou Docker |

## Exemplos

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
