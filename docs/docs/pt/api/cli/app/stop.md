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
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes locais ou Docker |

## Exemplos

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
